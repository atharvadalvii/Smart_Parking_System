"""Tests for the InfluxDB metrics writer."""
from unittest.mock import MagicMock, patch, call
import services.influx_client as influx_module


def _reset():
    influx_module._write_api = None


# ---------------------------------------------------------------------------
# skips when not configured
# ---------------------------------------------------------------------------

def test_write_slot_status_skips_when_no_url():
    _reset()
    with patch("services.influx_client.config") as mock_cfg:
        mock_cfg.INFLUXDB_URL = ""
        influx_module.write_slot_status("S1", "occupied")  # must not raise


def test_write_vehicle_count_skips_when_no_url():
    _reset()
    with patch("services.influx_client.config") as mock_cfg:
        mock_cfg.INFLUXDB_URL = ""
        influx_module.write_vehicle_count(3)


def test_write_fare_skips_when_no_url():
    _reset()
    with patch("services.influx_client.config") as mock_cfg:
        mock_cfg.INFLUXDB_URL = ""
        influx_module.write_fare("booking_abc", 4.50)


# ---------------------------------------------------------------------------
# calls write_api.write when configured
# ---------------------------------------------------------------------------

def test_write_slot_status_calls_write():
    mock_api = MagicMock()
    with patch("services.influx_client._get_write_api", return_value=mock_api):
        with patch("services.influx_client.config") as mock_cfg:
            mock_cfg.INFLUXDB_BUCKET = "parking"
            influx_module.write_slot_status("S1", "occupied")
    mock_api.write.assert_called_once()
    _, kwargs = mock_api.write.call_args
    assert kwargs["bucket"] == "parking"


def test_write_slot_status_free_sets_occupied_zero():
    mock_api = MagicMock()
    with patch("services.influx_client._get_write_api", return_value=mock_api):
        with patch("services.influx_client.config") as mock_cfg:
            mock_cfg.INFLUXDB_BUCKET = "parking"
            influx_module.write_slot_status("S2", "free")
    mock_api.write.assert_called_once()


def test_write_vehicle_count_calls_write():
    mock_api = MagicMock()
    with patch("services.influx_client._get_write_api", return_value=mock_api):
        with patch("services.influx_client.config") as mock_cfg:
            mock_cfg.INFLUXDB_BUCKET = "parking"
            influx_module.write_vehicle_count(5)
    mock_api.write.assert_called_once()


def test_write_fare_calls_write():
    mock_api = MagicMock()
    with patch("services.influx_client._get_write_api", return_value=mock_api):
        with patch("services.influx_client.config") as mock_cfg:
            mock_cfg.INFLUXDB_BUCKET = "parking"
            influx_module.write_fare("booking_xyz", 6.00)
    mock_api.write.assert_called_once()
    _, kwargs = mock_api.write.call_args
    assert kwargs["bucket"] == "parking"


# ---------------------------------------------------------------------------
# errors don't propagate
# ---------------------------------------------------------------------------

def test_influx_error_does_not_raise():
    mock_api = MagicMock()
    mock_api.write.side_effect = Exception("connection refused")
    with patch("services.influx_client._get_write_api", return_value=mock_api):
        with patch("services.influx_client.config") as mock_cfg:
            mock_cfg.INFLUXDB_BUCKET = "parking"
            influx_module.write_slot_status("S1", "occupied")
            influx_module.write_vehicle_count(2)
            influx_module.write_fare("booking_abc", 3.00)
