"""
Unit tests for TabPFN-v2 Foundation Model Engine (app.core.tabpfn_engine).
Validates:
1. Dataset structure and integrity (88+ real logged sessions)
2. TabPFN fitting and CPU inference execution
3. Probability bounds (0.0% to 100.0%) and confidence interval calculation
4. Vocal stem attenuation dynamics (vocal reduction boosts focus)
5. Out-of-fold backtest evaluation against baselines
"""

import pytest
import os
import pandas as pd
from app.core.tabpfn_engine import TabPFNEngine, FEATURE_COLS, CLASSIFIER_TARGET


@pytest.fixture(scope="module")
def engine():
    eng = TabPFNEngine()
    eng.load_data()
    eng.fit()
    return eng


def test_dataset_loading_and_features(engine):
    assert engine.df is not None
    assert len(engine.df) >= 85
    for col in FEATURE_COLS:
        assert col in engine.df.columns
    assert CLASSIFIER_TARGET in engine.df.columns
    assert engine.df[FEATURE_COLS].isnull().sum().sum() == 0


def test_predict_focus_bounds_and_keys(engine):
    features = {
        'track_duration_sec': 240,
        'bpm': 85,
        'vocal_presence_ratio': 0.10,
        'spectral_centroid_hz': 1800.0,
        'dynamic_range_db': 8.0,
        'hour_of_day': 14,
        'is_lyrics_heavy': 0,
        'prior_artist_skips': 0,
        'mini_mode_active': 1
    }
    res = engine.predict_focus(features)
    assert "focus_probability_pct" in res
    assert "skip_risk_pct" in res
    assert "stem_stripped_focus_pct" in res
    assert "confidence_interval_80" in res

    focus = res["focus_probability_pct"]
    skip = res["skip_risk_pct"]
    assert 0.0 <= focus <= 100.0
    assert 0.0 <= skip <= 100.0
    assert abs((focus + skip) - 100.0) < 0.2

    ci = res["confidence_interval_80"]
    assert ci["lower"] <= focus <= ci["upper"]


def test_vocal_attenuation_improves_focus_probability(engine):
    features = {
        'track_duration_sec': 210,
        'bpm': 120,
        'vocal_presence_ratio': 0.85,  # dense vocals
        'spectral_centroid_hz': 3100.0,
        'dynamic_range_db': 12.0,
        'hour_of_day': 16,
        'is_lyrics_heavy': 1,
        'prior_artist_skips': 1,
        'mini_mode_active': 1
    }
    # With high vocals
    res_dense = engine.predict_focus(features, vocal_override=0.85)
    # With vocals stripped
    res_stripped = engine.predict_focus(features, vocal_override=0.05)

    assert res_stripped["focus_probability_pct"] > res_dense["focus_probability_pct"]


def test_backtest_execution_and_metrics(engine):
    # Run backtest with 3 folds for test speed
    backtest = engine.run_backtest(n_splits=3)
    assert backtest["total_sessions_evaluated"] >= 85
    assert "ci_coverage_80pct" in backtest
    assert "comparison" in backtest
    assert len(backtest["comparison"]) == 3

    # TabPFN should outperform naive BPM rule
    tabpfn_row = backtest["comparison"][0]
    naive_row = backtest["comparison"][2]
    assert tabpfn_row["brier_score"] < naive_row["brier_score"]
    assert tabpfn_row["roc_auc"] > naive_row["roc_auc"]
