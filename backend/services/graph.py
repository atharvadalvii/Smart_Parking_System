import networkx as nx

# Physical layout: entry → junction → bay approach → slot
# Edge weights represent relative distance/steps on the lot floor.
_G = nx.Graph()
_G.add_weighted_edges_from([
    ("entry",    "junction", 1),
    ("junction", "bay_S1",   1),
    ("junction", "bay_S2",   2),
    ("junction", "bay_S3",   3),
    ("bay_S1",   "S1",       1),
    ("bay_S2",   "S2",       1),
    ("bay_S3",   "S3",       1),
])


def shortest_path(slot_id: str) -> list:
    """Return ordered waypoint list from entry to slot_id (Dijkstra)."""
    if slot_id not in _G:
        raise ValueError(f"Unknown slot: {slot_id}")
    return nx.shortest_path(_G, source="entry", target=slot_id, weight="weight")
