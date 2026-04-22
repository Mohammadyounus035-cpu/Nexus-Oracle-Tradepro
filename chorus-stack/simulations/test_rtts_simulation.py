"""Unit tests for rtts_simulation.py"""

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from rtts_simulation import Outcome, Scenario, run_scenario, simulate


class TestRunScenario(unittest.TestCase):
    def test_baseline_scenario_no_containment(self):
        s = Scenario("baseline", contamination=0.07, load=120, survivor_bias=0.01)
        result = run_scenario(s)
        # measured = max(0, 0.07 - 0.01) = 0.06
        self.assertAlmostEqual(result.measured_contamination, 0.06)
        # confidence_drift = min(1.0, 0.06 * 1.2 + 120/1000) = min(1.0, 0.072 + 0.12) = 0.192
        self.assertAlmostEqual(result.confidence_drift, 0.192)
        self.assertFalse(result.containment_triggered)

    def test_overload_scenario_triggers_containment_via_confidence_drift(self):
        s = Scenario("overload", contamination=0.18, load=380, survivor_bias=0.02)
        result = run_scenario(s)
        # measured = max(0, 0.18 - 0.02) = 0.16
        self.assertAlmostEqual(result.measured_contamination, 0.16)
        # confidence_drift = min(1.0, 0.16 * 1.2 + 380/1000) = min(1.0, 0.192 + 0.38) = 0.572
        self.assertAlmostEqual(result.confidence_drift, 0.572)
        # 0.16 not > 0.30, but 0.572 > 0.40, so containment = True
        self.assertTrue(result.containment_triggered)

    def test_survivor_bias_inversion_triggers_containment(self):
        s = Scenario("survivor_bias_inversion", contamination=0.42, load=240, survivor_bias=-0.08)
        result = run_scenario(s)
        # measured = max(0, 0.42 - (-0.08)) = max(0, 0.50) = 0.50
        self.assertAlmostEqual(result.measured_contamination, 0.50)
        # confidence_drift = min(1.0, 0.50 * 1.2 + 240/1000) = min(1.0, 0.60 + 0.24) = 0.84
        self.assertAlmostEqual(result.confidence_drift, 0.84)
        self.assertTrue(result.containment_triggered)

    def test_outcome_name_matches_scenario_name(self):
        s = Scenario("my-scenario", contamination=0.1, load=100, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertEqual(result.name, "my-scenario")

    def test_measured_contamination_clipped_to_zero_when_survivor_bias_exceeds_contamination(self):
        # survivor_bias > contamination would give negative measured; should be clipped to 0
        s = Scenario("biased", contamination=0.05, load=0, survivor_bias=0.10)
        result = run_scenario(s)
        self.assertEqual(result.measured_contamination, 0.0)

    def test_zero_load_does_not_affect_confidence_drift_load_term(self):
        s = Scenario("no-load", contamination=0.1, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        # confidence_drift = min(1.0, 0.1 * 1.2 + 0/1000) = 0.12
        self.assertAlmostEqual(result.confidence_drift, 0.12)

    def test_confidence_drift_capped_at_1_for_extreme_load(self):
        s = Scenario("extreme", contamination=0.9, load=10000, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertEqual(result.confidence_drift, 1.0)

    def test_containment_triggered_by_measured_contamination_exceeding_threshold(self):
        # measured = 0.31, confidence_drift well below 0.40
        s = Scenario("high-contamination", contamination=0.31, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        # confidence_drift = min(1.0, 0.31 * 1.2 + 0) = 0.372 (not > 0.40)
        self.assertAlmostEqual(result.measured_contamination, 0.31)
        self.assertLess(result.confidence_drift, 0.40)
        # 0.31 > 0.30, so containment = True
        self.assertTrue(result.containment_triggered)

    def test_containment_not_triggered_at_exactly_0_30_measured(self):
        # measured exactly 0.30: condition is > 0.30, so False
        s = Scenario("boundary", contamination=0.30, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertAlmostEqual(result.measured_contamination, 0.30)
        # confidence_drift = min(1.0, 0.30 * 1.2 + 0) = 0.36, which is not > 0.40
        self.assertAlmostEqual(result.confidence_drift, 0.36)
        self.assertFalse(result.containment_triggered)

    def test_containment_not_triggered_at_exactly_0_40_confidence_drift(self):
        # Need confidence_drift = exactly 0.40
        # 0.40 = measured * 1.2 + load/1000 => with measured=0, load = 400
        # but measured must come from contamination - survivor_bias, and measured=0 means contamination <= survivor_bias
        # Let: s.contamination = 0.0, load = 400, survivor_bias = 0 => measured=0.0, drift = 0 * 1.2 + 400/1000 = 0.4
        s = Scenario("drift-boundary", contamination=0.0, load=400, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertAlmostEqual(result.confidence_drift, 0.4)
        # 0.4 is not > 0.40, so containment = False
        self.assertFalse(result.containment_triggered)

    def test_containment_triggered_just_above_confidence_drift_threshold(self):
        # confidence_drift just above 0.40: load=401, measured=0.0
        s = Scenario("drift-above", contamination=0.0, load=401, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertGreater(result.confidence_drift, 0.40)
        self.assertTrue(result.containment_triggered)


class TestSimulate(unittest.TestCase):
    def test_simulate_returns_list_of_outcomes(self):
        scenarios = [
            Scenario("s1", contamination=0.05, load=50, survivor_bias=0.0),
            Scenario("s2", contamination=0.35, load=100, survivor_bias=0.0),
        ]
        results = simulate(scenarios)
        self.assertIsInstance(results, list)
        self.assertEqual(len(results), 2)
        self.assertIsInstance(results[0], Outcome)
        self.assertIsInstance(results[1], Outcome)

    def test_simulate_preserves_scenario_order(self):
        scenarios = [
            Scenario("first", contamination=0.05, load=50, survivor_bias=0.0),
            Scenario("second", contamination=0.1, load=100, survivor_bias=0.0),
            Scenario("third", contamination=0.2, load=200, survivor_bias=0.0),
        ]
        results = simulate(scenarios)
        names = [r.name for r in results]
        self.assertEqual(names, ["first", "second", "third"])

    def test_simulate_empty_input_returns_empty_list(self):
        results = simulate([])
        self.assertEqual(results, [])

    def test_simulate_single_scenario(self):
        scenarios = [Scenario("solo", contamination=0.1, load=100, survivor_bias=0.0)]
        results = simulate(scenarios)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].name, "solo")

    def test_simulate_matches_individual_run_scenario_calls(self):
        scenarios = [
            Scenario("a", contamination=0.07, load=120, survivor_bias=0.01),
            Scenario("b", contamination=0.18, load=380, survivor_bias=0.02),
        ]
        batch = simulate(scenarios)
        individual = [run_scenario(s) for s in scenarios]
        for b, i in zip(batch, individual):
            self.assertEqual(b.name, i.name)
            self.assertAlmostEqual(b.measured_contamination, i.measured_contamination)
            self.assertAlmostEqual(b.confidence_drift, i.confidence_drift)
            self.assertEqual(b.containment_triggered, i.containment_triggered)


if __name__ == "__main__":
    unittest.main()