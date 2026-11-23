"""Simple portfolio dashboard: loads outputs after running both analysis.py scripts."""
from pathlib import Path
import json
import pandas as pd
import plotly.express as px
import streamlit as st

ROOT=Path(__file__).resolve().parent
st.set_page_config(page_title="Kunal | Analytics Portfolio",layout="wide")
st.title("Analytics & AI Consulting Portfolio")
st.caption("Synthetic educational data only — not real employee, client or investment data.")
project=st.sidebar.radio("Project",["Workforce intelligence","AI value portfolio"])
if project=="Workforce intelligence":
    p=ROOT/"project-01-workforce-intelligence"
    data=p/"data/hr_attrition_synthetic.csv"
    metrics=p/"outputs/model_metrics.json"
    if data.exists():
        df=pd.read_csv(data)
        st.metric("Synthetic records",f"{len(df):,}")
        st.metric("Attrition rate",f"{(df.attrition=='Yes').mean():.1%}")
        dept=df.groupby("department",as_index=False).agg(headcount=("employee_id","count"),rate=("attrition",lambda s:(s=="Yes").mean()))
        st.plotly_chart(px.bar(dept,x="department",y="rate",title="Attrition rate by department"),use_container_width=True)
        if metrics.exists(): st.json(json.loads(metrics.read_text()))
    else: st.info("Run project-01-workforce-intelligence/analysis.py first.")
else:
    p=ROOT/"project-02-ai-value-portfolio"
    data=p/"data/ai_initiatives_synthetic.csv"
    metrics=p/"outputs/model_metrics.json"
    if data.exists():
        df=pd.read_csv(data)
        st.metric("Synthetic initiatives",f"{len(df):,}")
        st.metric("Median ROI",f"{df.roi_pct.median():.1f}%")
        st.plotly_chart(px.scatter(df,x="implementation_cost_lakh",y="realised_annual_benefit_lakh",color="sector",title="Implementation cost vs synthetic annual benefit"),use_container_width=True)
        if metrics.exists(): st.json(json.loads(metrics.read_text()))
    else: st.info("Run project-02-ai-value-portfolio/analysis.py first.")
st.warning("Predictions and recommendations are educational demonstrations. Do not use for employment or investment decisions.")
