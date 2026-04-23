#!/usr/bin/env python3
"""Medical HITL verifier simulation with Beta-based ROC and cost-weighted threshold analysis."""

from __future__ import annotations

from dataclasses import dataclass
from random import Random
from typing import Iterable, List, Sequence


@dataclass(frozen=True)
class CostConfig:
    c_review: float = 8.0
    c_fn: float = 300.0
    c_fp: float = 6.0


@dataclass(frozen=True)
class SweepConfig:
    population: int = 5000
    p_err: float = 0.18
    budget_values: Sequence[int] = (250, 450, 700, 1000)
    alpha_values: Sequence[float] = (0.0, 0.02, 0.06)
    thresholds: Sequence[float] = tuple(i / 100 for i in range(5, 100, 5))


@dataclass(frozen=True)
class RocPoint:
    threshold: float
    tpr: float
    fpr: float


@dataclass(frozen=True)
class SweepResult:
    budget: int
    alpha: float
    threshold: float
    requests: int
    missed_errors: int
    penalty: float
    savings: float
    objective: float


def beta_uncertainty_samples(rng: Random, n: int, a: float, b: float) -> List[float]:
    return [rng.betavariate(a, b) for _ in range(n)]


def roc_curve(points: Sequence[float], labels: Sequence[int], thresholds: Iterable[float]) -> List[RocPoint]:
    positives = sum(labels)
    negatives = len(labels) - positives
    out: List[RocPoint] = []
    for t in thresholds:
        tp = fp = 0
        for score, label in zip(points, labels):
            if score >= t:
                if label == 1:
                    tp += 1
                else:
                    fp += 1
        out.append(RocPoint(threshold=t, tpr=tp / positives if positives else 0.0, fpr=fp / negatives if negatives else 0.0))
    return out


def apply_budget(n: int, p_err: float, roc: RocPoint, budget: int) -> tuple[int, int, int, int]:
    expected_requests = int(round(n * (p_err * roc.tpr + (1.0 - p_err) * roc.fpr)))
    requests = min(expected_requests, budget)
    scale = (requests / expected_requests) if expected_requests else 0.0

    reviewed_error_rate = roc.tpr * scale
    reviewed_clean_rate = roc.fpr * scale

    total_errors = int(round(n * p_err))
    caught_errors = int(round(total_errors * reviewed_error_rate))
    missed_errors = max(0, total_errors - caught_errors)
    false_positives = int(round((n - total_errors) * reviewed_clean_rate))
    return requests, missed_errors, false_positives, expected_requests


def evaluate_threshold(n: int, p_err: float, budget: int, alpha: float, roc: RocPoint, cost: CostConfig) -> SweepResult:
    requests, missed_errors, false_positives, expected_requests = apply_budget(n, p_err, roc, budget)

    baseline_cost = int(round(n * p_err)) * cost.c_fn
    penalty = alpha * max(0, expected_requests - budget) ** 2
    intervention_cost = (cost.c_review * requests) + penalty + (cost.c_fn * missed_errors)
    savings = baseline_cost - intervention_cost

    objective = ((1.0 - p_err) * roc.fpr * cost.c_fp) + (p_err * (1.0 - roc.tpr) * cost.c_fn)

    return SweepResult(
        budget=budget,
        alpha=alpha,
        threshold=roc.threshold,
        requests=requests,
        missed_errors=missed_errors,
        penalty=penalty,
        savings=savings,
        objective=objective,
    )


def theoretical_optimum(roc_points: Sequence[RocPoint], p_err: float, cost: CostConfig) -> RocPoint:
    return min(
        roc_points,
        key=lambda rp: ((1.0 - p_err) * rp.fpr * cost.c_fp) + (p_err * (1.0 - rp.tpr) * cost.c_fn),
    )


def run(seed: int = 7) -> List[SweepResult]:
    cfg = SweepConfig()
    cost = CostConfig()
    rng = Random(seed)

    total_errors = int(round(cfg.population * cfg.p_err))
    total_clean = cfg.population - total_errors

    # Beta-based uncertainty distributions: errors trend high uncertainty, clean cases low uncertainty.
    error_scores = beta_uncertainty_samples(rng, total_errors, a=6.0, b=2.0)
    clean_scores = beta_uncertainty_samples(rng, total_clean, a=2.0, b=6.0)
    scores = error_scores + clean_scores
    labels = [1] * total_errors + [0] * total_clean

    roc_points = roc_curve(scores, labels, cfg.thresholds)
    theory = theoretical_optimum(roc_points, cfg.p_err, cost)

    results: List[SweepResult] = []
    for budget in cfg.budget_values:
        for alpha in cfg.alpha_values:
            for rp in roc_points:
                results.append(evaluate_threshold(cfg.population, cfg.p_err, budget, alpha, rp, cost))

    print("budget,alpha,best_threshold,best_savings,theoretical_threshold,theoretical_objective")
    for budget in cfg.budget_values:
        for alpha in cfg.alpha_values:
            candidates = [r for r in results if r.budget == budget and r.alpha == alpha]
            best = max(candidates, key=lambda r: r.savings)
            print(
                f"{budget},{alpha:.2f},{best.threshold:.2f},{best.savings:.2f},"
                f"{theory.threshold:.2f},{((1.0 - cfg.p_err) * theory.fpr * cost.c_fp + cfg.p_err * (1.0 - theory.tpr) * cost.c_fn):.2f}"
            )

    print("\n# Acquisition function hook")
    print("Replace static thresholding with BALD / expected-improvement policy in evaluate_threshold().")
    return results


if __name__ == "__main__":
    run()
