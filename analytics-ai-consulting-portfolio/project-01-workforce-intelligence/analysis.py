"""Synthetic workforce EDA, inferential tests and logistic-regression demonstration."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix

ROOT = Path(__file__).resolve().parent
DATA, OUT = ROOT / "data", ROOT / "outputs"

def main(n=1800, seed=42):
    rng = np.random.default_rng(seed)
    dept = rng.choice(["Sales","Operations","Technology","Finance","HR"], n, p=[.24,.27,.24,.15,.10])
    level = rng.choice([1,2,3,4,5], n, p=[.25,.31,.23,.14,.07])
    age = rng.integers(21,61,n)
    tenure = np.round(np.clip(rng.gamma(2.2,2.4,n),.1,35),1)
    promo = np.round(np.minimum(tenure,rng.gamma(1.7,2,n)),1)
    overtime = rng.choice(["Yes","No"],n,p=[.31,.69])
    satisfaction = rng.choice([1,2,3,4],n,p=[.12,.20,.40,.28])
    balance = rng.choice([1,2,3,4],n,p=[.08,.17,.47,.28])
    training = np.clip(rng.normal(28,12,n),0,80).round(1)
    remote = rng.integers(0,6,n)
    distance = rng.integers(1,51,n)
    pay_adj = pd.Series(dept).map({"Sales":0,"Operations":2,"Technology":12,"Finance":9,"HR":3}).to_numpy()
    income = (22000+level*10500+pay_adj*700+tenure*750+rng.normal(0,6500,n)).clip(18000).round().astype(int)
    performance = rng.choice([2,3,4],n,p=[.10,.68,.22])
    logit = (-3.00 + 1.05*(overtime=="Yes") + .92*(satisfaction==1) + .48*(satisfaction==2)
             + .62*(balance==1) + .34*(balance==2) + .13*promo + .020*distance
             - .028*tenure - .000010*income + .34*(dept=="Sales") + .32*(performance==2))
    p = 1/(1+np.exp(-logit))
    attrition = np.where(rng.random(n)<p,"Yes","No")
    df = pd.DataFrame({
        "employee_id":[f"SYN{i:05d}" for i in range(1,n+1)],"department":dept,"job_level":level,
        "age":age,"monthly_income_inr":income,"years_at_company":tenure,"years_since_promotion":promo,
        "overtime":overtime,"job_satisfaction":satisfaction,"work_life_balance":balance,
        "training_hours_year":training,"remote_days_per_week":remote,"distance_from_home_km":distance,
        "performance_rating":performance,"attrition":attrition
    })
    DATA.mkdir(exist_ok=True); OUT.mkdir(exist_ok=True)
    df.to_csv(DATA/"hr_attrition_synthetic.csv",index=False)
    yes=df.attrition.eq("Yes")
    group=df.groupby("department").agg(headcount=("employee_id","count"),leavers=("attrition",lambda s:(s=="Yes").sum()),
                                        avg_satisfaction=("job_satisfaction","mean")).reset_index()
    group["attrition_rate"] = group.leavers/group.headcount
    group.to_csv(OUT/"department_summary.csv",index=False)
    t,p_t=stats.ttest_ind(df.loc[yes,"monthly_income_inr"],df.loc[~yes,"monthly_income_inr"],equal_var=False)
    f,p_a=stats.f_oneway(*[g.job_satisfaction.to_numpy() for _,g in df.groupby("department")])
    chi,p_c,_,_=stats.chi2_contingency(pd.crosstab(df.overtime,df.attrition))
    r,p_r=stats.pearsonr(df.years_since_promotion,yes.astype(int))
    tests=[
      {"test":"Welch t-test: income by attrition","statistic":float(t),"p_value":float(p_t)},
      {"test":"One-way ANOVA: satisfaction by department","statistic":float(f),"p_value":float(p_a)},
      {"test":"Chi-square: overtime vs attrition","statistic":float(chi),"p_value":float(p_c)},
      {"test":"Pearson r: years since promotion vs attrition flag","statistic":float(r),"p_value":float(p_r)}
    ]
    (OUT/"inferential_tests.json").write_text(json.dumps(tests,indent=2))
    y=yes.astype(int); X=df.drop(columns=["employee_id","attrition"])
    nums=X.select_dtypes(include="number").columns.tolist(); cats=X.select_dtypes(exclude="number").columns.tolist()
    prep=ColumnTransformer([
      ("num",Pipeline([("impute",SimpleImputer(strategy="median")),("scale",StandardScaler())]),nums),
      ("cat",Pipeline([("impute",SimpleImputer(strategy="most_frequent")),("onehot",OneHotEncoder(handle_unknown="ignore"))]),cats)
    ])
    model=Pipeline([("prep",prep),("model",LogisticRegression(max_iter=1500,class_weight="balanced",random_state=42))])
    Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=.25,random_state=42,stratify=y)
    model.fit(Xtr,ytr); prob=model.predict_proba(Xte)[:,1]; pred=(prob>=.5).astype(int)
    metrics={"data":"synthetic educational data","records":len(df),"attrition_rate":float(y.mean()),
      "test_rows":len(yte),"roc_auc":float(roc_auc_score(yte,prob)),
      "precision_at_0_5":float(precision_score(yte,pred,zero_division=0)),
      "recall_at_0_5":float(recall_score(yte,pred,zero_division=0)),
      "f1_at_0_5":float(f1_score(yte,pred,zero_division=0)),
      "confusion_matrix":confusion_matrix(yte,pred).tolist(),
      "limitations":["Synthetic data; no claim of real-world validity.","Association is not causation.","Not for employment decisions."]}
    (OUT/"model_metrics.json").write_text(json.dumps(metrics,indent=2))
    print(json.dumps(metrics,indent=2))

if __name__=="__main__": main()
