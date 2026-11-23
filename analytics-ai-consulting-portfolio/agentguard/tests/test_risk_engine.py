import unittest
from risk_engine import load_catalog,load_profiles,inherent_score,assess

class AgentGuardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog=load_catalog()
        cls.profiles={x["id"]:x for x in load_profiles()}
    def test_weights_sum_to_one(self):
        self.assertAlmostEqual(sum(x["weight"] for x in self.catalog["dimensions"].values()),1.0)
    def test_scale_endpoints(self):
        dims=self.catalog["dimensions"]
        self.assertEqual(inherent_score({k:1 for k in dims},dims),0)
        self.assertEqual(inherent_score({k:5 for k in dims},dims),100)
    def test_residual_never_exceeds_inherent(self):
        r=assess(self.profiles["hr_operations_agent"],self.catalog)
        for x in r["scenarios"]:
            self.assertLessEqual(x["residual_score"],x["inherent_score"])
            self.assertGreaterEqual(x["residual_score"],0)
    def test_more_control_maturity_does_not_raise_residual(self):
        p=self.profiles["software_engineering_agent"]
        before=assess(p,self.catalog)
        after=assess(p,self.catalog,maturity_overrides={k:4 for k in p["control_maturity"]})
        b={x["risk_id"]:x["residual_score"] for x in before["scenarios"]}
        for x in after["scenarios"]:
            self.assertLessEqual(x["residual_score"],b[x["risk_id"]])
    def test_all_ten_agentic_categories_present(self):
        self.assertEqual({x["id"] for x in self.catalog["scenarios"]},{f"ASI{i:02d}" for i in range(1,11)})
    def test_out_of_range_rating_rejected(self):
        with self.assertRaises(ValueError):
            inherent_score({"likelihood":6}, {"likelihood":{"weight":1.0}})
if __name__=="__main__":
    unittest.main()
