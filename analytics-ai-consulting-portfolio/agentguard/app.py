from pathlib import Path
import json
import pandas as pd
import plotly.express as px
import streamlit as st
from risk_engine import load_catalog, load_profiles, assess, write_report

ROOT=Path(__file__).resolve().parent
st.set_page_config(page_title="AgentGuard",page_icon="🛡️",layout="wide")
st.title("AgentGuard — AI Agent Governance & Risk Assessment")
st.caption("Heuristic decision support only. Not a probability model, audit or security certification.")
catalog=load_catalog()
profiles={p["id"]:p for p in load_profiles()}
pid=st.sidebar.selectbox("Agent archetype",list(profiles),format_func=lambda k:profiles[k]["name"])
profile=profiles[pid]
st.sidebar.write(profile["description"])
st.info("The supplied profiles are illustrative assumptions. Edit ratings and maturity to reflect the system and evidence you are assessing.")

st.subheader("1. Rate risk exposure (1–5)")
rows=[]
for s in catalog["scenarios"]:
    rows.append({"risk_id":s["id"],"risk":s["name"],**profile["ratings"][s["id"]]})
risk_df=pd.DataFrame(rows)
dim_names=list(catalog["dimensions"])
config={k:st.column_config.NumberColumn(catalog["dimensions"][k]["label"],min_value=1,max_value=5,step=1) for k in dim_names}
edited=st.data_editor(risk_df,hide_index=True,disabled=["risk_id","risk"],column_config=config,use_container_width=True,key="risk_"+pid)

st.subheader("2. Rate control maturity")
st.caption("0 absent · 1 documented · 2 implemented/not tested · 3 tested with evidence · 4 continuously monitored")
cr=[]
for c in catalog["controls"]:
    cr.append({"control_id":c["id"],"control":c["name"],"maturity":profile["control_maturity"].get(c["id"],0)})
controls_df=pd.DataFrame(cr)
edited_controls=st.data_editor(controls_df,hide_index=True,disabled=["control_id","control"],column_config={"maturity":st.column_config.NumberColumn("Maturity (0–4)",min_value=0,max_value=4,step=1)},use_container_width=True,key="control_"+pid)
rating_overrides={r["risk_id"]:{k:int(r[k]) for k in dim_names} for _,r in edited.iterrows()}
maturity_overrides={r["control_id"]:int(r["maturity"]) for _,r in edited_controls.iterrows()}
result=assess(profile,catalog,rating_overrides,maturity_overrides)

st.subheader("3. Risk results")
a,b,c,d=st.columns(4)
a.metric("Average residual",f'{result["overall_average_residual_score"]:.1f}/100')
b.metric("Highest residual",f'{result["highest_residual_score"]:.1f}/100')
c.metric("Priority band",result["overall_band_by_highest_scenario"])
d.metric("Mandatory control gaps",result["mandatory_control_gap_instances"])
plot=pd.DataFrame(result["scenarios"])
fig=px.bar(plot.sort_values("residual_score"),x="residual_score",y="risk",orientation="h",color="residual_band",hover_data=["inherent_score","control_effectiveness_pct","mandatory_control_gaps"],title="Residual risk by scenario",labels={"residual_score":"Heuristic score (0–100)","risk":"Risk scenario"})
fig.update_layout(xaxis_range=[0,100])
st.plotly_chart(fig,use_container_width=True)
register=pd.DataFrame([{"Risk ID":x["risk_id"],"Risk":x["risk"],"Inherent":x["inherent_score"],"Inherent band":x["inherent_band"],"Controls effect %":x["control_effectiveness_pct"],"Maturity coverage %":x["control_maturity_coverage_pct"],"Tested controls":f'{x["tested_control_count"]}/{x["mapped_control_count"]}',"Residual":x["residual_score"],"Residual band":x["residual_band"],"Critical gaps":", ".join(x["mandatory_control_gaps"])} for x in result["scenarios"]])
st.dataframe(register,hide_index=True,use_container_width=True)

st.subheader("4. Recommended remediation")
selected=st.selectbox("Inspect scenario",[x["risk_id"] for x in result["scenarios"]],format_func=lambda rid:next(x["risk"] for x in result["scenarios"] if x["risk_id"]==rid))
item=next(x for x in result["scenarios"] if x["risk_id"]==selected)
st.write(item["description"])
st.write("**Example failure mode:** "+item["failure_mode"])
if item["mandatory_control_gaps"]:
    st.error("Mandatory controls below tested maturity: "+", ".join(item["mandatory_control_gaps"]))
for n,rec in enumerate(item["recommendations"],1):
    with st.expander(f'{n}. {rec["control_id"]} {rec["control"]} (maturity {rec["maturity"]}/4)'):
        st.write(rec["purpose"])
        st.markdown("**Implementation change**")
        st.write(rec["implementation"])
        st.markdown("**Evidence to request**")
        st.write(rec["evidence"])
st.markdown("**Scenario-specific recommendations**")
for x in item["framework_recommendations"]:
    st.write("- "+x)

st.subheader("5. Export")
st.download_button("Download risk register CSV",register.to_csv(index=False).encode(),file_name="agentguard_risk_register.csv",mime="text/csv")
st.download_button("Download full assessment JSON",json.dumps(result,indent=2),file_name="agentguard_assessment.json",mime="application/json")
st.warning("Scores and control strengths are prototype assumptions. A low score does not prove security; a high score does not establish that an attack is likely. Use independent security review and evidence.")
