let
    Source = Csv.Document(File.Contents("C:\YOUR_PATH\hr_attrition_synthetic.csv"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    TrimText = Table.TransformColumns(Headers, {{"department", Text.Trim, type text}, {"overtime", Text.Trim, type text}, {"attrition", Text.Trim, type text}}),
    Typed = Table.TransformColumnTypes(TrimText, {{"job_level", Int64.Type}, {"age", Int64.Type}, {"monthly_income_inr", Int64.Type}, {"years_at_company", type number}, {"years_since_promotion", type number}, {"job_satisfaction", Int64.Type}, {"work_life_balance", Int64.Type}}),
    AddedFlag = Table.AddColumn(Typed, "attrition_flag", each if [attrition] = "Yes" then 1 else 0, Int64.Type)
in
    AddedFlag
