-- MySQL 8.0+ | synthetic educational data only
CREATE DATABASE IF NOT EXISTS workforce_intelligence;
USE workforce_intelligence;

CREATE TABLE departments (
  department_name VARCHAR(40) PRIMARY KEY
);
INSERT IGNORE INTO departments VALUES
('Sales'),('Operations'),('Technology'),('Finance'),('HR');

CREATE TABLE employees (
  employee_id VARCHAR(12) PRIMARY KEY,
  department VARCHAR(40) NOT NULL,
  job_level TINYINT NOT NULL,
  age TINYINT NOT NULL,
  monthly_income_inr INT NOT NULL,
  years_at_company DECIMAL(5,1) NOT NULL,
  years_since_promotion DECIMAL(5,1) NOT NULL,
  overtime VARCHAR(3) NOT NULL,
  job_satisfaction TINYINT NOT NULL,
  work_life_balance TINYINT NOT NULL,
  training_hours_year DECIMAL(5,1) NOT NULL,
  remote_days_per_week TINYINT NOT NULL,
  distance_from_home_km INT NOT NULL,
  performance_rating TINYINT NOT NULL,
  attrition TINYINT NOT NULL COMMENT '1=Yes, 0=No',
  FOREIGN KEY (department) REFERENCES departments(department_name),
  INDEX idx_department(department),
  INDEX idx_attrition(attrition)
);

-- Import hr_attrition_synthetic.csv into a staging table using MySQL Workbench.
CREATE TABLE employees_staging (
  employee_id VARCHAR(12), department VARCHAR(40), job_level TINYINT, age TINYINT,
  monthly_income_inr INT, years_at_company DECIMAL(5,1), years_since_promotion DECIMAL(5,1),
  overtime VARCHAR(3), job_satisfaction TINYINT, work_life_balance TINYINT,
  training_hours_year DECIMAL(5,1), remote_days_per_week TINYINT, distance_from_home_km INT,
  performance_rating TINYINT, attrition VARCHAR(3)
);
