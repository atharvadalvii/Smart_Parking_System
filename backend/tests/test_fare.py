import pytest
from datetime import datetime, timezone, timedelta
from services.fare import calculate_fare, fare_to_cents


def _dt(hours_ago=0):
    return datetime.now(timezone.utc) - timedelta(hours=hours_ago)


def test_two_hour_park():
    entry = _dt(2)
    exit_ = _dt(0)
    assert calculate_fare(entry, exit_) == 6.00  # 2h * $3/hr


def test_minimum_charge_for_short_stay():
    entry = _dt(0)
    exit_ = entry + timedelta(minutes=15)
    assert calculate_fare(entry, exit_) == 2.00  # minimum applies


def test_rounding():
    entry = _dt(0)
    exit_ = entry + timedelta(minutes=100)  # 1.666... hours
    # 1.6667 * 3 = 5.0001 -> rounds to 5.0
    result = calculate_fare(entry, exit_)
    assert isinstance(result, float)
    assert result == round(result, 2)


def test_exact_one_hour():
    entry = _dt(1)
    exit_ = _dt(0)
    assert calculate_fare(entry, exit_) == 3.00


def test_invalid_exit_before_entry():
    entry = _dt(0)
    exit_ = entry - timedelta(hours=1)
    with pytest.raises(ValueError):
        calculate_fare(entry, exit_)


def test_fare_to_cents():
    assert fare_to_cents(6.00) == 600
    assert fare_to_cents(2.00) == 200
    assert fare_to_cents(3.50) == 350
