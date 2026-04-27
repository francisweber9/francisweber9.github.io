#!/usr/bin/env python3
from __future__ import annotations

import csv
from pathlib import Path

import numpy as np
import pandas as pd


SOURCE_DIR = Path("../NBA/DATA/RAW/Playtypes")
OUT_DIR = Path("analytics/data/nba")
OUT_PROFILE = OUT_DIR / "playtype_style_profiles_3y.csv"
OUT_SIMILARITY = OUT_DIR / "playtype_style_similarity_3y.csv"
MIN_YEAR = 2016
EXCLUDED_PLAYTYPES = {"Misc"}
MIN_TOTAL_POSS = 300
TOP_K = 12


def normalize_play_type(value: str) -> str:
    return str(value or "").replace(" ", "").strip()


def pretty_play_type(value: str) -> str:
    text = str(value or "").strip()
    if text == "PRBallHandler":
        return "P&R Ball Handler"
    if text == "PRRollMan":
        return "P&R Roll Man"
    return text


def cosine_similarity_matrix(values: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(values, axis=1, keepdims=True)
    norms[norms == 0] = 1e-12
    normalized = values / norms
    sim = normalized @ normalized.T
    np.clip(sim, -1.0, 1.0, out=sim)
    return sim


def compute_pca2(matrix: np.ndarray) -> np.ndarray:
    if matrix.shape[0] <= 1:
        return np.zeros((matrix.shape[0], 2))
    centered = matrix - matrix.mean(axis=0, keepdims=True)
    std = centered.std(axis=0, keepdims=True)
    std[std == 0] = 1.0
    standardized = centered / std
    u, s, _ = np.linalg.svd(standardized, full_matrices=False)
    coords = u[:, :2] * s[:2]
    if coords.shape[1] == 1:
        coords = np.column_stack([coords[:, 0], np.zeros(coords.shape[0])])
    return coords


def discover_years_from(source_dir: Path, min_year: int) -> list[int]:
    years = sorted(
        int(path.stem.replace("PlayType", ""))
        for path in source_dir.glob("PlayType*.csv")
        if path.stem.replace("PlayType", "").isdigit()
    )
    if not years:
        raise FileNotFoundError(f"No PlayType*.csv files found in {source_dir}")
    selected = [year for year in years if year >= min_year]
    if not selected:
        raise FileNotFoundError(f"No PlayType*.csv files found in {source_dir} from {min_year} onward")
    return selected


def build_profiles(last_years: list[int]) -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    for year in last_years:
        path = SOURCE_DIR / f"PlayType{year}.csv"
        if not path.exists():
            raise FileNotFoundError(f"Missing required file: {path}")
        df = pd.read_csv(path, usecols=["PLAYER_ID", "PLAYER_NAME", "PLAY_TYPE", "POSS"])
        df["season"] = year
        frames.append(df)

    all_rows = pd.concat(frames, ignore_index=True)
    all_rows["POSS"] = pd.to_numeric(all_rows["POSS"], errors="coerce").fillna(0.0)
    all_rows["PLAY_TYPE"] = all_rows["PLAY_TYPE"].map(normalize_play_type)
    all_rows = all_rows[all_rows["POSS"] > 0]
    all_rows = all_rows[~all_rows["PLAY_TYPE"].isin({normalize_play_type(x) for x in EXCLUDED_PLAYTYPES})]
    all_rows["PLAYER_ID"] = all_rows["PLAYER_ID"].astype(str)

    player_name_df = (
        all_rows.groupby("PLAYER_ID", as_index=False)
        .agg(
            player_name=("PLAYER_NAME", "first"),
            season_count=("season", "nunique"),
            total_possessions=("POSS", "sum"),
        )
    )
    player_name_df = player_name_df[player_name_df["total_possessions"] >= MIN_TOTAL_POSS]

    filtered = all_rows.merge(player_name_df[["PLAYER_ID"]], on="PLAYER_ID", how="inner")
    pivot = (
        filtered.pivot_table(
            index="PLAYER_ID",
            columns="PLAY_TYPE",
            values="POSS",
            aggfunc="sum",
            fill_value=0.0,
        )
        .sort_index(axis=1)
        .sort_index(axis=0)
    )
    totals = pivot.sum(axis=1).replace(0, np.nan)
    shares = pivot.div(totals, axis=0).fillna(0.0)
    share_cols = [f"share_{c}" for c in shares.columns]
    shares.columns = share_cols

    info = player_name_df.set_index("PLAYER_ID").loc[shares.index].copy()
    top_share_col = shares.idxmax(axis=1)
    info["style_archetype"] = top_share_col.map(lambda x: pretty_play_type(x.replace("share_", "")))
    coords = compute_pca2(shares.to_numpy())
    info["pc1"] = coords[:, 0]
    info["pc2"] = coords[:, 1]

    out = pd.concat([info, shares], axis=1).reset_index().rename(columns={"PLAYER_ID": "player_id"})
    out["seasons"] = f"{last_years[0]}-{last_years[-1]}"
    fixed_cols = ["player_id", "player_name", "seasons", "season_count", "total_possessions", "style_archetype", "pc1", "pc2"]
    share_only = [c for c in out.columns if c.startswith("share_")]
    return out[fixed_cols + share_only]


def build_similarity(profiles: pd.DataFrame) -> pd.DataFrame:
    share_cols = [c for c in profiles.columns if c.startswith("share_")]
    values = profiles[share_cols].to_numpy(dtype=float)
    sim = cosine_similarity_matrix(values)
    player_ids = profiles["player_id"].astype(str).tolist()
    player_names = profiles["player_name"].astype(str).tolist()

    id_by_ix = {i: player_ids[i] for i in range(len(player_ids))}
    name_by_id = {player_ids[i]: player_names[i] for i in range(len(player_ids))}

    rows = []
    for i, pid in id_by_ix.items():
        scores = sim[i].copy()
        scores[i] = -np.inf
        order = np.argsort(scores)[::-1]
        rank = 0
        for j in order:
            if not np.isfinite(scores[j]):
                continue
            rank += 1
            if rank > TOP_K:
                break
            comp_id = id_by_ix[j]
            rows.append(
                {
                    "player_id": pid,
                    "player_name": name_by_id[pid],
                    "comp_rank": rank,
                    "comp_player_id": comp_id,
                    "comp_player_name": name_by_id[comp_id],
                    "similarity": float(scores[j]),
                }
            )
    return pd.DataFrame(rows)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    years = discover_years_from(SOURCE_DIR, MIN_YEAR)
    profiles = build_profiles(years)
    similarity = build_similarity(profiles)
    profiles.to_csv(OUT_PROFILE, index=False, quoting=csv.QUOTE_MINIMAL)
    similarity.to_csv(OUT_SIMILARITY, index=False, quoting=csv.QUOTE_MINIMAL)
    print(f"Wrote {OUT_PROFILE} ({len(profiles)} rows)")
    print(f"Wrote {OUT_SIMILARITY} ({len(similarity)} rows)")


if __name__ == "__main__":
    main()
