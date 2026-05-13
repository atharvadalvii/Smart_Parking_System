import logging
import config

logger = logging.getLogger(__name__)

_write_api = None


def _get_write_api():
    """Lazy-init the write API. Returns None when InfluxDB is not configured."""
    global _write_api
    if _write_api is not None:
        return _write_api
    if not config.INFLUXDB_URL:
        return None
    try:
        from influxdb_client import InfluxDBClient
        from influxdb_client.client.write_api import SYNCHRONOUS
        client = InfluxDBClient(
            url=config.INFLUXDB_URL,
            token=config.INFLUXDB_TOKEN,
            org=config.INFLUXDB_ORG,
        )
        _write_api = client.write_api(write_options=SYNCHRONOUS)
        logger.info("InfluxDB connected → %s  bucket=%s", config.INFLUXDB_URL, config.INFLUXDB_BUCKET)
    except Exception as exc:
        logger.warning("InfluxDB could not connect (%s) — metrics disabled", exc)
    return _write_api


def write_slot_status(slot_id: str, status: str):
    """Record a slot occupancy change. Measurement: parking_slots."""
    api = _get_write_api()
    if api is None:
        return
    from influxdb_client import Point
    point = (
        Point("parking_slots")
        .tag("slot_id", slot_id)
        .field("status", status)
        .field("occupied", 1 if status == "occupied" else 0)
    )
    try:
        api.write(bucket=config.INFLUXDB_BUCKET, record=point)
    except Exception as exc:
        logger.warning("InfluxDB write failed (slot_status): %s", exc)


def write_vehicle_count(count: int):
    """Record the current vehicle count. Measurement: vehicle_count."""
    api = _get_write_api()
    if api is None:
        return
    from influxdb_client import Point
    point = Point("vehicle_count").field("count", count)
    try:
        api.write(bucket=config.INFLUXDB_BUCKET, record=point)
    except Exception as exc:
        logger.warning("InfluxDB write failed (vehicle_count): %s", exc)


def write_fare(booking_id: str, fare_aud: float):
    """Record a completed fare payment. Measurement: parking_fares."""
    api = _get_write_api()
    if api is None:
        return
    from influxdb_client import Point
    point = (
        Point("parking_fares")
        .tag("booking_id", booking_id)
        .field("fare_aud", float(fare_aud))
    )
    try:
        api.write(bucket=config.INFLUXDB_BUCKET, record=point)
    except Exception as exc:
        logger.warning("InfluxDB write failed (fare): %s", exc)
