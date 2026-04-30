from datetime import datetime, timezone
import config

def calculate_fare(entry_time: datetime, exit_time: datetime) -> float:
    """Return fare in AUD, rounded to 2 decimal places. Minimum charge applies."""
    duration_seconds = (exit_time - entry_time).total_seconds()
    if duration_seconds < 0:
        raise ValueError("exit_time must be after entry_time")
    hours = duration_seconds / 3600
    fare = max(hours * config.RATE_PER_HOUR, config.MINIMUM_CHARGE)
    return round(fare, 2)

def fare_to_cents(fare_aud: float) -> int:
    """Convert AUD float to integer cents for Stripe."""
    return int(round(fare_aud * 100))
