import resource
import tracemalloc
import time


class RaceTracker:
    """Track timing and memory for each race stage.

    NOTE on memory tracking:
    tracemalloc only tracks memory allocated by Python's allocator.
    C extensions (pandas/NumPy, polars/Rust, duckdb/C++) allocate memory
    outside Python's allocator, so tracemalloc underreports for them.
    We supplement with resource.getrusage (RSS) to capture total process
    memory, giving a more realistic picture for native-code libraries.
    """

    def __init__(self):
        tracemalloc.start()
        self.start_time = None
        self.events = []
        self._baseline_rss_mb = self._get_rss_mb()

    @staticmethod
    def _get_rss_mb() -> float:
        """Get current RSS in MB via getrusage (works on Linux)."""
        usage = resource.getrusage(resource.RUSAGE_SELF)
        # ru_maxrss is in KB on Linux
        return round(usage.ru_maxrss / 1024, 2)

    def get_memory_mb(self) -> float:
        """Return the higher of tracemalloc current and RSS delta."""
        current_py, _ = tracemalloc.get_traced_memory()
        py_mb = current_py / 1024 / 1024
        rss_delta = self._get_rss_mb() - self._baseline_rss_mb
        return round(max(py_mb, rss_delta, 0), 2)

    def get_peak_memory_mb(self) -> float:
        """Return the higher of tracemalloc peak and RSS delta."""
        _, peak_py = tracemalloc.get_traced_memory()
        py_mb = peak_py / 1024 / 1024
        rss_delta = self._get_rss_mb() - self._baseline_rss_mb
        return round(max(py_mb, rss_delta, 0), 2)

    def start_race(self):
        tracemalloc.clear_traces()
        tracemalloc.start()
        self._baseline_rss_mb = self._get_rss_mb()
        self.start_time = time.perf_counter()
        self.events = []

    def stage_start(self, stage: int) -> dict:
        event = {"event": "stage", "stage": stage, "status": "started", "memory_mb": self.get_memory_mb()}
        self.events.append(event)
        return event

    def stage_complete(self, stage: int, stage_start_time: float) -> dict:
        elapsed_ms = round((time.perf_counter() - stage_start_time) * 1000, 1)
        event = {"event": "stage", "stage": stage, "status": "completed", "memory_mb": self.get_memory_mb(), "elapsed_ms": elapsed_ms}
        self.events.append(event)
        return event

    def finish(self) -> dict:
        total_ms = round((time.perf_counter() - self.start_time) * 1000, 1)
        event = {"event": "finished", "total_ms": total_ms, "peak_memory_mb": self.get_peak_memory_mb()}
        self.events.append(event)
        tracemalloc.stop()
        return event
