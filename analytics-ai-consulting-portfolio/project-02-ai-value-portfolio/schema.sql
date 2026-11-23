-- MySQL 8.0+ | synthetic educational data only
CREATE DATABASE IF NOT EXISTS ai_value_portfolio;
USE ai_value_portfolio;

CREATE TABLE ai_initiatives (
  initiative_id VARCHAR(12) PRIMARY KEY,
  sector VARCHAR(50) NOT NULL,
  business_function VARCHAR(50) NOT NULL,
  use_case VARCHAR(50) NOT NULL,
  monthly_process_volume INT NOT NULL,
  avg_cycle_time_hours DECIMAL(6,2) NOT NULL,
  data_readiness_score TINYINT NOT NULL,
  governance_risk_score TINYINT NOT NULL,
  adoption_readiness_pct DECIMAL(5,2) NOT NULL,
  automation_suitability_score TINYINT NOT NULL,
  implementation_cost_lakh DECIMAL(10,2) NOT NULL,
  annual_gross_savings_estimate_lakh DECIMAL(10,2) NOT NULL,
  hourly_cost_inr INT NOT NULL,
  hours_saved_per_case DECIMAL(7,3) NOT NULL,
  realised_annual_benefit_lakh DECIMAL(10,2) NOT NULL,
  net_benefit_lakh DECIMAL(10,2) NOT NULL,
  roi_pct DECIMAL(10,2) NOT NULL,
  INDEX idx_sector(sector),
  INDEX idx_readiness(data_readiness_score),
  INDEX idx_risk(governance_risk_score)
);
-- Import data/ai_initiatives_synthetic.csv into ai_initiatives with MySQL Workbench.
