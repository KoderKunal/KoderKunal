"""Aggregate-only, allow-listed analytics explainer using a local Ollama model."""
from pathlib import Path
import argparse
import json
import os
import pandas as pd
import requests

ROOT = Path(__file__).resolve().parent
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

def ollama(prompt):
    response = requests.post(OLLAMA_URL, json={"model": MODEL, "prompt": prompt, "stream": False}, timeout=180)
    response.raise_for_status()
    return response.json().get("response", "").strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", choices=["workforce", "ai_portfolio"], required=True)
    parser.add_argument("--question", required=True)
    args = parser.parse_args()

    if args.project == "workforce":
        path = ROOT / "project-01-workforce-intelligence/data/hr_attrition_synthetic.csv"
        tools = {
            "overview": lambda d: {"records": len(d), "attrition_rate_pct": round(100*(d.attrition=="Yes").mean(),2)},
            "department_breakdown": lambda d: (d.groupby("department").agg(headcount=("employee_id","count"),leavers=("attrition",lambda s:(s=="Yes").sum())).assign(attrition_rate_pct=lambda x:(100*x.leavers/x.headcount).round(2)).reset_index().to_dict("records"))
        }
    else:
        path = ROOT / "project-02-ai-value-portfolio/data/ai_initiatives_synthetic.csv"
        tools = {
            "overview": lambda d: {"initiatives": len(d), "median_roi_pct": round(float(d.roi_pct.median()),2), "mean_benefit_lakh": round(float(d.realised_annual_benefit_lakh.mean()),2)},
            "sector_breakdown": lambda d: d.groupby("sector").agg(count=("initiative_id","count"),mean_roi_pct=("roi_pct","mean"),mean_readiness=("data_readiness_score","mean"),mean_risk=("governance_risk_score","mean")).round(2).reset_index().to_dict("records")
        }
    if not path.exists():
        raise FileNotFoundError("Run the selected project's analysis.py first.")
    df = pd.read_csv(path)
    names = list(tools)
    selected = ollama("Choose exactly one tool name from this allow-list: " + ", ".join(names) + ". Return only its name. Question: " + args.question).strip().split()[0].strip("'").strip('"')
    if selected not in tools:
        selected = names[-1]
    evidence = tools[selected](df)
    prompt = ("Explain only the computed evidence. The data are synthetic educational data. "
              "Do not claim causation or recommend employment/investment decisions. State one limitation. "
              "Question: " + args.question + "\nEvidence: " + json.dumps(evidence))
    print("Selected aggregate tool:", selected)
    print("Computed evidence:", json.dumps(evidence, indent=2))
    print("Local model explanation:", ollama(prompt))

if __name__ == "__main__":
    main()
