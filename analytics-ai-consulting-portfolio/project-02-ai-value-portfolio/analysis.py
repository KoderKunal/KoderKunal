"""Synthetic AI initiative analysis, statistical tests, regression and budget scenario."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT=Path(__file__).resolve().parent
DATA,OUT=ROOT/"data",ROOT/"outputs"
BUDGET_LAKH=350

def solve_knapsack(costs, values, budget):
    """0/1 knapsack; cost input uses rounded integer lakh units."""
    n=len(costs); dp=np.zeros((n+1,budget+1)); take=np.zeros((n+1,budget+1),dtype=bool)
    for i,(cost,value) in enumerate(zip(costs,values),start=1):
        dp[i]=dp[i-1]
        if cost<=budget:
            cand=dp[i-1,:budget+1-cost]+value
            mask=cand>dp[i,cost:]
            dp[i,cost:]=np.where(mask,cand,dp[i,cost:])
            take[i,cost:]=mask
    chosen=[]; remaining=budget
    for i in range(n,0,-1):
        if take[i,remaining]:
            chosen.append(i-1); remaining-=costs[i-1]
    return chosen

def main(n=700,seed=73):
    rng=np.random.default_rng(seed)
    sectors=np.array(["Financial Services","Retail","Healthcare","Manufacturing","Telecommunications","Professional Services"])
    funcs=np.array(["Customer Operations","Finance","HR","Supply Chain","IT","Risk & Compliance"])
    cases=np.array(["Document Processing","Customer Support","Forecasting","Knowledge Assistant","Quality Inspection","Workflow Automation"])
    sector=rng.choice(sectors,n); function=rng.choice(funcs,n); use_case=rng.choice(cases,n)
    volume=rng.integers(200,10001,n); cycle=np.round(rng.uniform(.15,5,n),2)
    readiness=rng.integers(1,6,n); risk=rng.integers(1,6,n); adoption=rng.integers(25,96,n)
    suitability=rng.integers(1,6,n); cost=np.round(rng.uniform(8,125,n),1)
    hourly=rng.integers(250,901,n); saved=np.round(rng.uniform(.05,.5,n),3)
    gross=(volume*12*saved*hourly/100000).round(2)
    factor=np.clip(.13+.105*readiness+.0023*adoption+.055*suitability-.065*(risk-1),.12,.92)
    adj=pd.Series(sector).map({"Financial Services":1.03,"Retail":1.,"Healthcare":.92,"Manufacturing":1.05,"Telecommunications":1.02,"Professional Services":.98}).to_numpy()
    benefit=(gross*factor*adj*rng.normal(1,.12,n).clip(.6,1.35)).clip(.5).round(2)
    net=(benefit-cost).round(2); roi=(net/cost*100).round(1)
    df=pd.DataFrame({"initiative_id":[f"AI{i:04d}" for i in range(1,n+1)],"sector":sector,
      "business_function":function,"use_case":use_case,"monthly_process_volume":volume,
      "avg_cycle_time_hours":cycle,"data_readiness_score":readiness,"governance_risk_score":risk,
      "adoption_readiness_pct":adoption,"automation_suitability_score":suitability,
      "implementation_cost_lakh":cost,"annual_gross_savings_estimate_lakh":gross,
      "hourly_cost_inr":hourly,"hours_saved_per_case":saved,
      "realised_annual_benefit_lakh":benefit,"net_benefit_lakh":net,"roi_pct":roi})
    DATA.mkdir(exist_ok=True); OUT.mkdir(exist_ok=True); df.to_csv(DATA/"ai_initiatives_synthetic.csv",index=False)
    sector_summary=df.groupby("sector").agg(initiatives=("initiative_id","count"),avg_cost=("implementation_cost_lakh","mean"),
      avg_benefit=("realised_annual_benefit_lakh","mean"),avg_roi=("roi_pct","mean")).reset_index()
    sector_summary.to_csv(OUT/"sector_summary.csv",index=False)
    f,p_a=stats.f_oneway(*[g.roi_pct.to_numpy() for _,g in df.groupby("sector")])
    r,p_r=stats.pearsonr(df.data_readiness_score,df.realised_annual_benefit_lakh)
    low=df.loc[df.governance_risk_score<=2,"roi_pct"]; high=df.loc[df.governance_risk_score>=4,"roi_pct"]
    t,p_t=stats.ttest_ind(low,high,equal_var=False)
    tests=[{"test":"ANOVA: ROI by sector","statistic":float(f),"p_value":float(p_a)},
      {"test":"Pearson r: data readiness vs benefit","statistic":float(r),"p_value":float(p_r)},
      {"test":"Welch t-test: low-risk vs high-risk ROI","statistic":float(t),"p_value":float(p_t)}]
    (OUT/"inferential_tests.json").write_text(json.dumps(tests,indent=2))
    excluded=["initiative_id","realised_annual_benefit_lakh","net_benefit_lakh","roi_pct"]
    X=df.drop(columns=excluded); y=df.realised_annual_benefit_lakh
    nums=X.select_dtypes(include="number").columns.tolist(); cats=X.select_dtypes(exclude="number").columns.tolist()
    prep=ColumnTransformer([
      ("num",Pipeline([("impute",SimpleImputer(strategy="median")),("scale",StandardScaler())]),nums),
      ("cat",Pipeline([("impute",SimpleImputer(strategy="most_frequent")),("onehot",OneHotEncoder(handle_unknown="ignore"))]),cats)])
    model=Pipeline([("prep",prep),("rf",RandomForestRegressor(n_estimators=300,min_samples_leaf=3,random_state=42,n_jobs=-1))])
    Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=.25,random_state=42)
    model.fit(Xtr,ytr); pred=model.predict(Xte)
    metrics={"data":"synthetic educational data","test_rows":len(yte),
      "mae_lakh":float(mean_absolute_error(yte,pred)),
      "rmse_lakh":float(np.sqrt(mean_squared_error(yte,pred))),"r2":float(r2_score(yte,pred)),
      "limitations":["Synthetic data; model metrics do not transfer to a real portfolio.","Predicted benefit is not guaranteed saving.","Human due diligence is required."]}
    (OUT/"model_metrics.json").write_text(json.dumps(metrics,indent=2))
    model.fit(X,y); scored=df.copy(); scored["predicted_annual_benefit_lakh"]=model.predict(X)
    costs=scored.implementation_cost_lakh.round().astype(int).tolist()
    values=scored.predicted_annual_benefit_lakh.astype(float).tolist()
    chosen=solve_knapsack(costs,values,BUDGET_LAKH)
    selected=scored.iloc[chosen].copy(); selected.to_csv(OUT/"selected_portfolio_under_budget.csv",index=False)
    scenario={"budget_lakh":BUDGET_LAKH,"selected_initiatives":len(selected),
      "selected_cost_lakh":float(selected.implementation_cost_lakh.sum()),
      "selected_predicted_annual_benefit_lakh":float(selected.predicted_annual_benefit_lakh.sum()),
      "selection":"0/1 knapsack on rounded integer costs; maximise predicted annual benefit"}
    (OUT/"budget_scenario.json").write_text(json.dumps(scenario,indent=2))
    print(json.dumps({"metrics":metrics,"scenario":scenario},indent=2))

if __name__=="__main__": main()
