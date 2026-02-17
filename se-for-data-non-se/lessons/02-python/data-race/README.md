# Data Race - Python Data Processing Benchmark

A visual benchmark comparing Pure Python, Pandas, Polars, and DuckDB processing 1M rows.

## Quick Start

```bash
docker compose up --build -d
```

Open http://localhost:3000, click **Generate Dataset**, wait for completion, then **START RACE**.

## Dataset & Docker Volume

The generated CSV (≈85 MB, 1M rows) is stored in a **Docker named volume** called `data-race_race-data`. This volume lives outside your project folder, managed by Docker at:

```
/var/lib/docker/volumes/data-race_race-data/_data/dataset.csv
```

### Key behaviors

| Command | Containers | Images | Volume (CSV) |
|---|---|---|---|
| `docker compose down` | Removed | Kept | **Kept** |
| `docker compose down -v` | Removed | Kept | **Removed** |
| `docker rmi <images>` | — | Removed | **Kept** |

### Useful volume commands

```bash
# Inspect volume location on disk
docker volume inspect data-race_race-data

# List all volumes
docker volume ls

# Remove the volume manually (deletes the CSV)
docker volume rm data-race_race-data

# Nuclear option: remove all unused volumes (careful!)
docker volume prune
```

### Full cleanup (containers + images + volume)

```bash
docker compose down -v
docker rmi data-race-frontend data-race-api data-race-runner-python data-race-runner-pandas data-race-runner-polars data-race-runner-duckdb
```

After a full cleanup, the next `docker compose up --build` starts fresh — you'll need to generate the dataset again via the UI.

---

## Suggested Prompt

If you want to switch from a Docker named volume to a bind mount (so the CSV appears in your project folder for manual removal), use this prompt:

> In `docker-compose.yml`, replace the named volume `race-data:/data` with a bind mount `./data:/data` on the API service (and `./data:/data:ro` on the runners). Remove the `volumes:` section at the bottom that declares `race-data:`. This way the generated CSV will live at `data-race/data/dataset.csv` in the project directory and can be deleted manually with `rm data/dataset.csv`.
