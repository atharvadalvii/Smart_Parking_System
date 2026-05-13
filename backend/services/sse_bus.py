import queue
import threading

_subscribers: list = []
_lock = threading.Lock()


def subscribe() -> queue.Queue:
    q = queue.Queue()
    with _lock:
        _subscribers.append(q)
    return q


def unsubscribe(q: queue.Queue):
    with _lock:
        try:
            _subscribers.remove(q)
        except ValueError:
            pass


def broadcast(data: dict):
    with _lock:
        for q in list(_subscribers):
            q.put_nowait(data)
