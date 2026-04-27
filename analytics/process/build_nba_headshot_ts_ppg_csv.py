#!/usr/bin/env python3
from __future__ import annotations

import csv
from dataclasses import dataclass, field
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GAMESTORY_GLOB = ROOT.parent / "NBA" / "2025" / "PROCESS" / "GameStory" / "2025"
HEADSHOT_MAP_CSV = ROOT / "analytics" / "data" / "nba" / "playtype_style_headshots.csv"
OUT_CSV = ROOT / "analytics" / "data" / "nba" / "headshot_ts_ppg_2025.csv"


@dataclass
class PlayerAgg:
    player_name: str = ""
    game_ids: set[str] = field(default_factory=set)
    points_sum: float = 0.0
    points_count: int = 0
    ts_sum: float = 0.0
    ts_count: int = 0


def parse_float(value: str) -> float | None:
    if value is None:
        return None
    try:
        out = float(value)
    except (TypeError, ValueError):
        return None
    return out


def load_headshot_map(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = str(row.get("player_id", "")).strip()
            hs = str(row.get("headshot_path", "")).strip()
            avail = str(row.get("headshot_available", "0")).strip()
            if pid and hs and avail == "1":
                out[pid] = hs
    return out


def build() -> None:
    headshot_by_id = load_headshot_map(HEADSHOT_MAP_CSV)
    files = sorted(GAMESTORY_GLOB.glob("*_GameStory.csv"))
    if not files:
        raise FileNotFoundError(f"No GameStory files found in {GAMESTORY_GLOB}")

    agg: dict[str, PlayerAgg] = {}
    for fp in files:
        with fp.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = str(row.get("player_id", "")).strip()
                name = str(row.get("player_name", "")).strip()
                gid = str(row.get("game_id", "")).strip()
                if not pid or not name:
                    continue
                rec = agg.setdefault(pid, PlayerAgg(player_name=name))
                rec.player_name = name
                if gid:
                    rec.game_ids.add(gid)

                pts = parse_float(row.get("points"))
                if pts is not None:
                    rec.points_sum += pts
                    rec.points_count += 1

                ts = parse_float(row.get("ts_pct"))
                if ts is not None:
                    rec.ts_sum += ts
                    rec.ts_count += 1

    rows: list[dict[str, str | int | float]] = []
    for pid, rec in agg.items():
        gp = len(rec.game_ids)
        if rec.points_count == 0 or rec.ts_count == 0 or gp == 0:
            continue
        ppg = rec.points_sum / rec.points_count
        ts_pct = rec.ts_sum / rec.ts_count
        rows.append(
            {
                "player_id": pid,
                "player_name": rec.player_name,
                "season": "2025",
                "gp": gp,
                "ppg": round(ppg, 4),
                "ts_pct": round(ts_pct, 6),
                "headshot_path": headshot_by_id.get(pid, ""),
                "headshot_available": 1 if pid in headshot_by_id else 0,
            }
        )

    rows.sort(key=lambda r: (float(r["ppg"]), int(r["gp"])), reverse=True)
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "player_id",
            "player_name",
            "season",
            "gp",
            "ppg",
            "ts_pct",
            "headshot_path",
            "headshot_available",
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} players to {OUT_CSV}")


if __name__ == "__main__":
    build()
