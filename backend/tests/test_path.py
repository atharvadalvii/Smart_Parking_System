"""Tests for the Dijkstra path endpoint and graph service."""
import pytest
from services.graph import shortest_path


# ---------------------------------------------------------------------------
# graph service
# ---------------------------------------------------------------------------

def test_shortest_path_s1():
    path = shortest_path("S1")
    assert path[0] == "entry"
    assert path[-1] == "S1"


def test_shortest_path_s2():
    path = shortest_path("S2")
    assert path[0] == "entry"
    assert path[-1] == "S2"


def test_shortest_path_s3():
    path = shortest_path("S3")
    assert path[0] == "entry"
    assert path[-1] == "S3"


def test_shortest_path_unknown_raises():
    with pytest.raises(ValueError, match="Unknown slot"):
        shortest_path("S99")


def test_s1_cheaper_than_s3():
    """S1 has a lower weighted cost than S3 given the graph layout."""
    import networkx as nx
    from services.graph import _G
    cost_s1 = nx.shortest_path_length(_G, source="entry", target="S1", weight="weight")
    cost_s3 = nx.shortest_path_length(_G, source="entry", target="S3", weight="weight")
    assert cost_s1 < cost_s3


# ---------------------------------------------------------------------------
# /api/path endpoint
# ---------------------------------------------------------------------------

def test_path_endpoint_valid(client):
    rv = client.get("/api/path/?slot=S1")
    assert rv.status_code == 200
    data = rv.get_json()
    assert data["slot_id"] == "S1"
    assert data["path"][0] == "entry"
    assert data["path"][-1] == "S1"


def test_path_endpoint_all_slots(client):
    for slot in ("S1", "S2", "S3"):
        rv = client.get(f"/api/path/?slot={slot}")
        assert rv.status_code == 200
        assert rv.get_json()["path"][-1] == slot


def test_path_endpoint_unknown_slot(client):
    rv = client.get("/api/path/?slot=S99")
    assert rv.status_code == 404


def test_path_endpoint_missing_param(client):
    rv = client.get("/api/path/")
    assert rv.status_code == 400
