USE workforce_intelligence;

INSERT IGNORE INTO employees
SELECT employee_id,department,job_level,age,monthly_income_inr,years_at_company,years_since_promotion,
       overtime,job_satisfaction,work_life_balance,training_hours_year,remote_days_per_week,
       distance_from_home_km,performance_rating,CASE WHEN attrition='Yes' THEN 1 ELSE 0 END
FROM employees_staging;

CREATE OR REPLACE VIEW vw_department_attrition AS
SELECT d.department_name AS department, COUNT(e.employee_id) AS headcount,
       SUM(e.attrition) AS leavers,
       ROUND(100*AVG(e.attrition),2) AS attrition_rate_pct,
       ROUND(AVG(e.job_satisfaction),2) AS avg_satisfaction
FROM departments d LEFT JOIN employees e ON d.department_name=e.department
GROUP BY d.department_name;

-- Join + group-by: compare overtime cohorts.
SELECT overtime, COUNT(*) AS headcount, SUM(attrition) AS leavers,
       ROUND(100*AVG(attrition),2) AS attrition_rate_pct
FROM employees GROUP BY overtime ORDER BY attrition_rate_pct DESC;

-- CTE + window function: rank departments by attrition.
WITH dept AS (
 SELECT department,COUNT(*) AS headcount,SUM(attrition) AS leavers,AVG(attrition)*100 AS rate_pct
 FROM employees GROUP BY department
)
SELECT department,headcount,leavers,ROUND(rate_pct,2) AS rate_pct,
       DENSE_RANK() OVER(ORDER BY rate_pct DESC) AS rate_rank
FROM dept;

DROP FUNCTION IF EXISTS fn_department_attrition_rate;
DELIMITER $$
CREATE FUNCTION fn_department_attrition_rate(p_dept VARCHAR(40))
RETURNS DECIMAL(6,2) READS SQL DATA
BEGIN
 DECLARE v_rate DECIMAL(6,2);
 SELECT ROUND(100*AVG(attrition),2) INTO v_rate FROM employees WHERE department=p_dept;
 RETURN COALESCE(v_rate,0.00);
END$$
DELIMITER ;

SELECT * FROM vw_department_attrition ORDER BY attrition_rate_pct DESC;
SELECT fn_department_attrition_rate('Sales') AS sales_attrition_rate_pct;
