let
    Source = Csv.Document(File.Contents("C:\YOUR_PATH\ai_initiatives_synthetic.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    TrimText = Table.TransformColumns(Headers, {{"sector", Text.Trim, type text}, {"business_function", Text.Trim, type text}, {"use_case", Text.Trim, type text}}),
    Typed = Table.TransformColumnTypes(TrimText, {{"monthly_process_volume", Int64.Type}, {"data_readiness_score", Int64.Type}, {"governance_risk_score", Int64.Type}, {"implementation_cost_lakh", type number}, {"realised_annual_benefit_lakh", type number}, {"roi_pct", type number}}),
    PositiveCostRows = Table.SelectRows(Typed, each [implementation_cost_lakh] > 0),
    AddedBenefitCostRatio = Table.AddColumn(PositiveCostRows, "benefit_cost_ratio", each [realised_annual_benefit_lakh] / [implementation_cost_lakh], type number)
in
    AddedBenefitCostRatio
