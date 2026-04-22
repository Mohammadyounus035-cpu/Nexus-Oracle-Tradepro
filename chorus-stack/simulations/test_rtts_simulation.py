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
        # containment: measured(0.16) <= 0.30 but confidence_drift(0.572) > 0.40
        self.assertTrue(result.containment_triggered)

    def test_survivor_bias_inversion_triggers_containment_via_measured_contamination(self):
        s = Scenario("survivor_bias_inversion", contamination=0.42, load=240, survivor_bias=-0.08)
        result = run_scenario(s)
        # measured = max(0, 0.42 - (-0.08)) = max(0, 0.50) = 0.50
        self.assertAlmostEqual(result.measured_contamination, 0.50)
        # confidence_drift = min(1.0, 0.50 * 1.2 + 240/1000) = min(1.0, 0.60 + 0.24) = min(1.0, 0.84) = 0.84
        self.assertAlmostEqual(result.confidence_drift, 0.84)
        # containment: measured(0.50) > 0.30 → True
        self.assertTrue(result.containment_triggered)

    def test_scenario_name_preserved_in_outcome(self):
        s = Scenario("my-test-scenario", contamination=0.1, load=50, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertEqual(result.name, "my-test-scenario")

    def test_measured_contamination_floored_at_zero(self):
        # survivor_bias larger than contamination → measured should be 0, not negative
        s = Scenario("floor-test", contamination=0.05, load=10, survivor_bias=0.20)
        result = run_scenario(s)
        self.assertAlmostEqual(result.measured_contamination, 0.0)
        self.assertGreaterEqual(result.measured_contamination, 0.0)

    def test_confidence_drift_capped_at_one(self):
        # Very high contamination and load should cap confidence_drift at 1.0
        s = Scenario("cap-test", contamination=1.0, load=10000, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertAlmostEqual(result.confidence_drift, 1.0)

    def test_containment_triggered_by_measured_contamination_above_threshold(self):
        # measured > 0.30 should trigger containment even with low confidence_drift
        s = Scenario("contamination-threshold", contamination=0.31, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        # measured = 0.31, confidence_drift = min(1.0, 0.31*1.2 + 0) = 0.372
        self.assertGreater(result.measured_contamination, 0.30)
        self.assertTrue(result.containment_triggered)

    def test_containment_not_triggered_when_both_thresholds_are_not_exceeded(self):
        # measured = 0.30 exactly is not > 0.30, confidence_drift = min(1.0, 0.30*1.2 + 0) = 0.36 which is not > 0.40
        s = Scenario("below-threshold", contamination=0.30, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertAlmostEqual(result.measured_contamination, 0.30)
        self.assertFalse(result.containment_triggered)

    def test_containment_triggered_by_confidence_drift_at_boundary(self):
        # Need confidence_drift > 0.40; measured <= 0.30
        # measured = 0.20, confidence_drift = min(1.0, 0.20*1.2 + load/1000) = 0.24 + load/1000
        # need 0.24 + load/1000 > 0.40 → load > 160
        s = Scenario("drift-boundary", contamination=0.20, load=200, survivor_bias=0.0)
        result = run_scenario(s)
        # measured = 0.20, confidence_drift = min(1.0, 0.24 + 0.20) = 0.44
        self.assertAlmostEqual(result.measured_contamination, 0.20)
        self.assertAlmostEqual(result.confidence_drift, 0.44)
        self.assertTrue(result.containment_triggered)

    def test_zero_load_zero_contamination_no_containment(self):
        s = Scenario("zero-all", contamination=0.0, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertAlmostEqual(result.measured_contamination, 0.0)
        self.assertAlmostEqual(result.confidence_drift, 0.0)
        self.assertFalse(result.containment_triggered)

    def test_outcome_is_outcome_dataclass(self):
        s = Scenario("type-check", contamination=0.1, load=50, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertIsInstance(result, Outcome)


class TestSimulate(unittest.TestCase):
    def test_simulate_returns_list_of_outcomes(self):
        scenarios = [
            Scenario("s1", contamination=0.05, load=100, survivor_bias=0.0),
            Scenario("s2", contamination=0.35, load=50, survivor_bias=0.0),
        ]
        results = simulate(scenarios)
        self.assertEqual(len(results), 2)
        for r in results:
            self.assertIsInstance(r, Outcome)

    def test_simulate_preserves_order(self):
        scenarios = [
            Scenario("first", contamination=0.05, load=10, survivor_bias=0.0),
            Scenario("second", contamination=0.40, load=10, survivor_bias=0.0),
            Scenario("third", contamination=0.10, load=10, survivor_bias=0.0),
        ]
        results = simulate(scenarios)
        self.assertEqual(results[0].name, "first")
        self.assertEqual(results[1].name, "second")
        self.assertEqual(results[2].name, "third")

    def test_simulate_empty_scenarios_returns_empty_list(self):
        results = simulate([])
        self.assertEqual(results, [])

    def test_simulate_handles_single_scenario(self):
        scenarios = [Scenario("only", contamination=0.5, load=200, survivor_bias=0.0)]
        results = simulate(scenarios)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].name, "only")
        self.assertTrue(results[0].containment_triggered)

    def test_simulate_canonical_scenarios(self):
        """Regression test for the three canonical scenarios defined in main()."""
        scenarios = [
            Scenario("baseline", contamination=0.07, load=120, survivor_bias=0.01),
            Scenario("overload", contamination=0.18, load=380, survivor_bias=0.02),
            Scenario("survivor_bias_inversion", contamination=0.42, load=240, survivor_bias=-0.08),
        ]
        results = simulate(scenarios)

        self.assertEqual(len(results), 3)

        baseline = results[0]
        self.assertFalse(baseline.containment_triggered)
        self.assertAlmostEqual(baseline.measured_contamination, 0.06)

        overload = results[1]
        self.assertTrue(overload.containment_triggered)
        self.assertAlmostEqual(overload.measured_contamination, 0.16)

        inversion = results[2]
        self.assertTrue(inversion.containment_triggered)
        self.assertAlmostEqual(inversion.measured_contamination, 0.50)

    def test_simulate_accepts_generator(self):
        """simulate() should accept any iterable, including a generator."""
        def gen():
            yield Scenario("g1", contamination=0.1, load=50, survivor_bias=0.0)
            yield Scenario("g2", contamination=0.5, load=50, survivor_bias=0.0)

        results = simulate(gen())
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].name, "g1")
        self.assertEqual(results[1].name, "g2")


if __name__ == "__main__":
    unittest.main()