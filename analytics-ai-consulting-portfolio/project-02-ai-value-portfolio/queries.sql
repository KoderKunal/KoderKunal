USE ai_value_portfolio;

CREATE OR REPLACE VIEW vw_sector_portfolio AS
SELECT sector,COUNT(*) AS initiative_count,
       ROUND(AVG(implementation_cost_lakh),2) AS avg_cost_lakh,
       ROUND(AVG(realised_annual_benefit_lakh),2) AS avg_benefit_lakh,
       ROUND(AVG(roi_pct),2) AS avg_roi_pct,
       ROUND(AVG(data_readiness_score),2) AS avg_data_readiness,
       ROUND(AVG(governance_risk_score),2) AS avg_governance_risk
FROM ai_initiatives GROUP BY sector;

-- Join to show number of functions represented in each sector.
WITH function_mix AS (
 SELECT sector,COUNT(DISTINCT business_function) AS function_count
 FROM ai_initiatives GROUP BY sector
)
SELECT s.*,f.function_count
FROM vw_sector_portfolio s JOIN function_mix f USING(sector)
ORDER BY s.avg_roi_pct DESC;

-- Window function: rank initiative records by synthetic ROI.
SELECT initiative_id,sector,business_function,implementation_cost_lakh,roi_pct,
       DENSE_RANK() OVER(ORDER BY roi_pct DESC) AS roi_rank
FROM ai_initiatives ORDER BY roi_rank LIMIT 20;

DROP FUNCTION IF EXISTS fn_net_roi_pct;
DELIMITER $$
CREATE FUNCTION fn_net_roi_pct(p_benefit DECIMAL(10,2),p_cost DECIMAL(10,2))
RETURNS DECIMAL(10,2) DETERMINISTIC NO SQL
BEGIN
 IF p_cost IS NULL OR p_cost<=0 THEN RETURN NULL; END IF;
 RETURN ROUND(100*(p_benefit-p_cost)/p_cost,2);
END$$
DELIMITER ;

SELECT * FROM vw_sector_portfolio ORDER BY avg_roi_pct DESC;
SELECT fn_net_roi_pct(45.00,30.00) AS example_net_roi_pct;
