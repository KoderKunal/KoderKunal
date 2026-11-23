"""AgentGuard heuristic risk engine. Not a calibrated probability or audit tool."""
from pathlib import Path
import argparse, csv, json

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"

def load_catalog():
    return json.loads((DATA / "catalogs.json").read_text(encoding="utf-8"))

def load_profiles():
    return json.loads((DATA / "profiles.json").read_text(encoding="utf-8"))["profiles"]

def validate_int(value, low, high, label):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or int(value) != value or not low <= int(value) <= high:
        raise ValueError(f"{label} must be an integer from {low} to {high}")
    return int(value)

def band(score, bands):
    for item in bands:
        if item["min"] <= score <= item["max"]:
            return item["label"]
    return "Critical" if score > 100 else "Low"

def inherent_score(ratings, dimensions):
    if abs(sum(v["weight"] for v in dimensions.values()) - 1.0) > 1e-8:
        raise ValueError("Dimension weights must sum to 1.0")
    total = 0.0
    for key, spec in dimensions.items():
        value = validate_int(ratings.get(key), 1, 5, key)
        total += ((value - 1) / 4) * spec["weight"] * 100
    return round(total, 2)

def control_effectiveness(ids, maturity, control_map):
    remaining, levels, tested = 1.0, [], 0
    for cid in ids:
        if cid not in control_map:
            raise ValueError(f"Unknown control: {cid}")
        level = validate_int(maturity.get(cid, 0), 0, 4, cid)
        levels.append(level / 4)
        tested += level >= 3
        strength = float(control_map[cid]["strength"])
        effect = strength * (level / 4)
        remaining *= 1 - effect
    return round(1 - remaining, 4), round(sum(levels) / len(levels), 4), int(tested)

def assess(profile, catalog, rating_overrides=None, maturity_overrides=None):
    control_map = {c["id"]: c for c in catalog["controls"]}
    maturity = dict(profile.get("control_maturity", {}))
    maturity.update(maturity_overrides or {})
    for cid in control_map:
        maturity[cid] = validate_int(maturity.get(cid, 0), 0, 4, cid)
    rating_overrides = rating_overrides or {}
    rows = []
    for risk in catalog["scenarios"]:
        ratings = dict(profile["ratings"][risk["id"]])
        ratings.update(rating_overrides.get(risk["id"], {}))
        inherent = inherent_score(ratings, catalog["dimensions"])
        efficacy, coverage, tested = control_effectiveness(risk["controls"], maturity, control_map)
        residual = round(inherent * (1 - efficacy), 2)
        mandatory_gaps = [cid for cid in risk["critical_controls"] if maturity[cid] < 3]
        actions = []
        for cid in risk["controls"]:
            level = maturity[cid]
            if level < 3:
                c = control_map[cid]
                actions.append({
                    "control_id": cid, "control": c["name"], "maturity": level,
                    "mandatory_gap": cid in mandatory_gaps,
                    "priority_score": round(c["strength"] * (4 - level), 3),
                    "purpose": c["purpose"], "implementation": c["implementation"],
                    "evidence": c["evidence"]
                })
        actions.sort(key=lambda x: (x["mandatory_gap"], x["priority_score"]), reverse=True)
        rows.append({
            "risk_id": risk["id"], "risk": risk["name"], "layer": risk["layer"],
            "description": risk["description"], "failure_mode": risk["failure_mode"],
            "ratings": ratings, "inherent_score": inherent,
            "inherent_band": band(inherent, catalog["risk_bands"]),
            "control_effectiveness_pct": round(efficacy * 100, 1),
            "control_maturity_coverage_pct": round(coverage * 100, 1),
            "tested_control_count": tested, "mapped_control_count": len(risk["controls"]),
            "residual_score": residual, "residual_band": band(residual, catalog["risk_bands"]),
            "mandatory_control_gaps": mandatory_gaps, "recommendations": actions,
            "framework_recommendations": risk["recommendations"]
        })
    rows.sort(key=lambda x: x["residual_score"], reverse=True)
    max_score = max(x["residual_score"] for x in rows)
    return {
        "model": "AgentGuard heuristic v1.0", "profile_id": profile["id"],
        "assessment_profile": profile["name"], "profile_description": profile["description"],
        "overall_average_residual_score": round(sum(x["residual_score"] for x in rows) / len(rows), 2),
        "highest_residual_score": max_score,
        "overall_band_by_highest_scenario": band(max_score, catalog["risk_bands"]),
        "mandatory_control_gap_instances": sum(len(x["mandatory_control_gaps"]) for x in rows),
        "risk_scenarios_assessed": len(rows), "scenarios": rows, "control_maturity": maturity,
        "limitations": [
            "Scores are heuristic prioritisation indices, not probabilities or calibrated loss estimates.",
            "Ratings are subjective ordinal judgements; sample profiles are illustrative assumptions.",
            "Control strengths and risk thresholds are prototype design assumptions.",
            "Controls may be correlated or fail together; the combination formula is only an approximation.",
            "Maturity ratings require evidence; self-reported maturity is not independent assurance.",
            "Framework mapping is for traceability, not a claim of formal framework conformance."
        ]
    }

def write_report(result, out_dir):
    out_dir = Path(out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "assessment.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    rows = []
    for x in result["scenarios"]:
        rows.append({
            "risk_id": x["risk_id"], "risk": x["risk"], "inherent_score": x["inherent_score"],
            "inherent_band": x["inherent_band"], "control_effectiveness_pct": x["control_effectiveness_pct"],
            "control_maturity_coverage_pct": x["control_maturity_coverage_pct"],
            "tested_controls": f'{x["tested_control_count"]}/{x["mapped_control_count"]}',
            "residual_score": x["residual_score"], "residual_band": x["residual_band"],
            "mandatory_gaps": ";".join(x["mandatory_control_gaps"])
        })
    with (out_dir / "risk_register.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    actions = [{"risk_id": x["risk_id"], "risk": x["risk"], **a} for x in result["scenarios"] for a in x["recommendations"]]
    if actions:
        with (out_dir / "control_gap_actions.csv").open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(actions[0])); w.writeheader(); w.writerows(actions)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--profile", default="software_engineering_agent")
    p.add_argument("--output", default=str(ROOT / "reports"))
    args = p.parse_args()
    catalog = load_catalog()
    profiles = {x["id"]: x for x in load_profiles()}
    if args.profile not in profiles:
        raise SystemExit("Unknown profile. Options: " + ", ".join(profiles))
    result = assess(profiles[args.profile], catalog)
    write_report(result, args.output)
    print(json.dumps({k: result[k] for k in ("assessment_profile", "overall_average_residual_score", "highest_residual_score", "overall_band_by_highest_scenario", "mandatory_control_gap_instances")}, indent=2))

if __name__ == "__main__":
    main()
