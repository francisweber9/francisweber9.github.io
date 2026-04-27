      const topTabs = document.querySelectorAll(".tab");
      const topPanes = [
        document.getElementById("pane-nbl"),
        document.getElementById("pane-nba"),
        document.getElementById("pane-nbl1")
      ];

      function activateTopTab(targetPane) {
        topTabs.forEach((tab) => {
          const active = tab.dataset.pane === targetPane;
          tab.setAttribute("aria-selected", active ? "true" : "false");
        });

        topPanes.forEach((pane) => {
          pane.classList.toggle("active", pane.id === `pane-${targetPane}`);
        });
      }

      topTabs.forEach((tab) => {
        tab.addEventListener("click", () => activateTopTab(tab.dataset.pane));
      });

      const nblSubTabs = document.querySelectorAll("#pane-nbl .subtab");
      const nblSubPanes = [
        document.getElementById("subpane-rapm"),
        document.getElementById("subpane-wowy"),
        document.getElementById("subpane-lineup")
      ];

      function activateSubTab(targetPane) {
        nblSubTabs.forEach((tab) => {
          const active = tab.dataset.pane === targetPane;
          tab.setAttribute("aria-selected", active ? "true" : "false");
        });
        nblSubPanes.forEach((pane) => {
          pane.classList.toggle("active", pane.id === `subpane-${targetPane}`);
        });
      }

      nblSubTabs.forEach((tab) => {
        tab.addEventListener("click", () => activateSubTab(tab.dataset.pane));
      });

      const nbaSubTabs = document.querySelectorAll("#pane-nba .subtab");
      const nbaSubPanes = [
        document.getElementById("subpane-shotmaps"),
        document.getElementById("subpane-style"),
        document.getElementById("subpane-headshots")
      ];

      function activateNbaSubTab(targetPane) {
        nbaSubTabs.forEach((tab) => {
          const active = tab.dataset.pane === targetPane;
          tab.setAttribute("aria-selected", active ? "true" : "false");
        });
        nbaSubPanes.forEach((pane) => {
          pane.classList.toggle("active", pane.id === `subpane-${targetPane}`);
        });
      }

      nbaSubTabs.forEach((tab) => {
        tab.addEventListener("click", () => activateNbaSubTab(tab.dataset.pane));
      });

      const RAPM_SOURCES = {
        raw: "analytics/data/rapm_raw.json",
        luck: "analytics/data/rapm_luck_adjusted.json"
      };

      const rapmData = { raw: [], luck: [] };
      const percentileCache = { raw: {}, luck: {} };
      let rapmMode = "luck";
      let rapmSort = { key: "netRAPM", direction: "desc" };
      let rapmSearchQuery = "";
      let wowySelectedPlayers = [];

      const rapmBody = document.getElementById("rapm-body");
      const rapmStatus = document.getElementById("rapm-status");
      const toggleRaw = document.getElementById("toggle-raw");
      const toggleLuck = document.getElementById("toggle-luck");
      const rapmSearch = document.getElementById("rapm-search");
      const percentileKeys = ["oRAPM", "dRAPM", "netRAPM", "rawNetRating"];
      const WOWY_URL = "analytics/data/wowy_2025_2026.json";
      const DPM_URL = "analytics/data/dpm_trajectory.json";
      const NBA_TATUM_SHOTS_URL = "analytics/data/nba/jayson_tatum_shots_2025.csv";
      const NBA_TATUM_ZONE_URL = "analytics/data/nba/tatum_zone_colours_2025.csv";
      const NBA_ZONE_SVG_URL = "analytics/images/nba/total.svg";
      const NBA_LEAGUE_BINS_URL = "analytics/data/nba/league_shot_bins_by_decade.csv";
      const NBA_STYLE_PROFILE_URL = "analytics/data/nba/playtype_style_profiles_3y.csv";
      const NBA_STYLE_SIMILARITY_URL = "analytics/data/nba/playtype_style_similarity_3y.csv";
      const NBA_STYLE_HEADSHOTS_URL = "analytics/data/nba/playtype_style_headshots.csv";
      let wowyData = null;
      let dpmData = null;

      const wowyTeam = document.getElementById("wowy-team");
      const wowyLuckToggle = document.getElementById("wowy-luck-toggle");
      const wowyMeta = document.getElementById("wowy-meta");
      const wowyBody = document.getElementById("wowy-body");
      const wowyPool = document.getElementById("wowy-pool");
      const wowySelected = document.getElementById("wowy-selected");
      const dpmSearch = document.getElementById("dpm-search");
      const dpmSearchResults = document.getElementById("dpm-search-results");
      const dpmSelectedChips = document.getElementById("dpm-selected-chips");
      const dpmMetric = document.getElementById("dpm-metric");
      const dpmMeta = document.getElementById("dpm-meta");
      const dpmChart = document.getElementById("dpm-chart");
      const dpmLegend = document.getElementById("dpm-legend");
      const dpmPalette = ["#4f86e5", "#e76f6f", "#45a36c"];
      const dpmChipClass = ["blue", "red", "green"];
      let dpmSelectedIds = [];
      const nbaShotLayer = document.getElementById("nba-shot-layer");
      const nbaShotSummary = document.getElementById("nba-shot-summary");
      const nbaSvgZones = document.getElementById("nba-svg-zones");
      const nbaZoneStatsLayer = document.getElementById("nba-zone-stats-layer");
      const nbaBinsPlot = document.getElementById("nba-bins-plot");
      const nbaBinsSummary = document.getElementById("nba-bins-summary");
      const DECADE_ORDER = ["1990s", "2000s", "2010s", "2020s"];
      const DECADE_YEAR_RANGES = { "1990s": "1997–1999", "2000s": "2000–2009", "2010s": "2010–2019", "2020s": "2020–2026" };
      let nbaDecadeIdx = DECADE_ORDER.indexOf("2020s");
      let nbaScaleMode = "all";
      let nbaGlobalScale = null;
      const nbaPrevBtn = document.getElementById("nba-decade-prev");
      const nbaNextBtn = document.getElementById("nba-decade-next");
      const nbaDecadePips = document.querySelectorAll(".nba-decade-pip");
      const nbaScaleAllBtn = document.getElementById("nba-scale-all");
      const nbaScaleDecadeBtn = document.getElementById("nba-scale-decade");
      const nbaStylePlayerSearch = document.getElementById("nba-style-player-search");
      const nbaStyleSearchResults = document.getElementById("nba-style-search-results");
      const nbaStyleMeta = document.getElementById("nba-style-meta");
      const nbaStyleScatter = document.getElementById("nba-style-scatter");
      const nbaStyleBody = document.getElementById("nba-style-body");
      let nbaSpinTimer = null;
      let nbaSpinTheta = 0;
      let nbaLastCamera = null;
      const nbaBinsRenderCache = new Map();
      let nbaShotsCache = [];
      let nbaLeagueBinsCache = [];
      let nbaStyleProfiles = [];
      let nbaStyleSimilarity = [];
      let nbaStyleById = {};
      let nbaStyleNeighborsById = {};
      let nbaStyleHeadshotById = {};
      let nbaStyleShareKeys = [];
      let nbaStyleSelectedId = "";
      const nbaStylePalette = ["#1f77b4", "#d62728", "#2ca02c", "#9467bd", "#e377c2", "#17becf", "#bcbd22", "#ff7f0e"];
      const nbaStyleClusterColors = ["#4f86e5", "#ef6f6c", "#42a56f", "#b07ae6", "#f4a259", "#2a9d8f", "#c1121f", "#6d597a"];
      const nbaStyleClusterNames = {
        1: "Interior Bigs",
        2: "Offensive Engines",
        3: "Spotup Shooters",
        4: "Hybrid Bigs",
        5: "Combo Guards",
        6: "Stretch Bigs",
      };
      const nbaStyleClusterLabelAnchors = {
        1: { x: 0.04, y: 0.72, anchor: "start" },
        2: { x: 0.76, y: 0.13, anchor: "end" },
        3: { x: 0.88, y: 0.95, anchor: "end" },
        4: { x: 0.29, y: 0.84, anchor: "middle" },
        5: { x: 1, y: 0.55, anchor: "end" },
        6: { x: 0.53, y: 0.91, anchor: "middle" },
      };
      let nbaStyleClusterData = { k: 0, clusters: [], byPlayerId: {} };
      const nbaZoneMap = {
        LeftThree: "LeftThree",
        LeftClose: "LeftClose",
        RightThree: "RightThree",
        TopThree: "TopThree",
        Charge: "Charge",
        TopClose: "TopClose",
        DeepThree: "DeepThree",
        LeftCorner: "LeftCorner",
        LeftMid: "LeftMid",
        RightClose: "RightClose",
        RightCorner: "RightCorner",
        TopMid: "TopMid",
        RightMid: "RightMid",
      };
      const nbaZonePositions = {
        LeftThree: { x: 8, y: 55 },
        LeftClose: { x: 30, y: 15 },
        RightThree: { x: 92, y: 55 },
        TopThree: { x: 50, y: 70 },
        Charge: { x: 50, y: 5 },
        TopClose: { x: 50, y: 30 },
        DeepThree: { x: 50, y: 90 },
        LeftCorner: { x: 5, y: 5 },
        LeftMid: { x: 15, y: 15 },
        RightClose: { x: 70, y: 15 },
        RightCorner: { x: 95, y: 5 },
        TopMid: { x: 50, y: 50 },
        RightMid: { x: 85, y: 15 },
      };

      function titleFromUnderscore(value) {
        if (typeof value !== "string") return "-";
        const cleaned = value.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
        if (!cleaned) return "-";
        const romans = new Set(["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]);
        return cleaned
          .split(" ")
          .map((word) =>
            word
              .split("-")
              .map((part) => {
                const lower = part.toLowerCase();
                if (romans.has(lower)) return lower.toUpperCase();
                return lower.charAt(0).toUpperCase() + lower.slice(1);
              })
              .join("-")
          )
          .join(" ");
      }

      function formatPlayerName(value) {
        if (typeof value !== "string") return "-";
        return value.includes("_") ? titleFromUnderscore(value) : value.trim();
      }

      function formatTeamName(value) {
        if (typeof value !== "string") return "-";
        return value.replace(/_+/g, " ").replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim();
      }

      function normalizeForSearch(value) {
        return String(value ?? "")
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      function normalizeRows(rows) {
        return rows.map((row) => {
          const playerName = formatPlayerName(row.playerName);
          return {
            ...row,
            playerName,
            teamName: formatTeamName(row.teamName),
            playerSearch: normalizeForSearch(playerName),
          };
        });
      }

      function initials(name) {
        const parts = String(name || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        if (!parts.length) return "??";
        const first = (parts[0][0] || "").toUpperCase();
        const second = parts.length > 1 ? (parts[1][0] || "").toUpperCase() : first;
        return `${first}${second}`;
      }

      function fmtPct(value, digits = 1) {
        if (!Number.isFinite(value)) return "-";
        return `${value.toFixed(digits)}%`;
      }

      function formatSigned(value, digits = 1) {
        if (!Number.isFinite(value)) return "-";
        const sign = value > 0 ? "+" : "";
        return `${sign}${value.toFixed(digits)}`;
      }

      function lastNameOnly(name) {
        const cleaned = String(name || "").trim();
        if (!cleaned) return "-";
        const parts = cleaned.split(/\s+/);
        return parts[parts.length - 1];
      }

      function htmlEscape(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function safeRate(points, poss) {
        if (!Number.isFinite(points) || !Number.isFinite(poss) || poss <= 0) return null;
        return (points / poss) * 100;
      }

      function safePct(made, attempts) {
        if (!Number.isFinite(made) || !Number.isFinite(attempts) || attempts <= 0) return null;
        return (made / attempts) * 100;
      }

      async function fetchJsonStrict(url) {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`${url} returned HTTP ${response.status}`);
        }
        return response.json();
      }

      function parseCsvText(text) {
        const rows = [];
        let row = [];
        let cell = "";
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') {
              cell += '"';
              i += 1;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === "," && !inQuotes) {
            row.push(cell);
            cell = "";
          } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
            if (ch === "\r" && text[i + 1] === "\n") i += 1;
            row.push(cell);
            if (row.some((x) => x !== "")) rows.push(row);
            row = [];
            cell = "";
          } else {
            cell += ch;
          }
        }
        row.push(cell);
        if (row.some((x) => x !== "")) rows.push(row);
        if (!rows.length) return [];
        const headers = rows[0];
        return rows.slice(1).map((vals) => {
          const out = {};
          headers.forEach((h, idx) => {
            out[h] = vals[idx] ?? "";
          });
          return out;
        });
      }

      async function fetchCsvStrict(url) {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`${url} returned HTTP ${response.status}`);
        }
        const text = await response.text();
        return parseCsvText(text);
      }

      function transformShotCoordinate(x, y) {
        const nx = ((x + 250) / 500) * 100;
        const ny = ((y + 42) / 470) * 100;
        return { x: nx, y: ny };
      }

      function renderNbaShotChart(rows) {
        if (!nbaShotLayer || !nbaShotSummary) return;
        nbaShotLayer.innerHTML = "";
        const made = rows.filter((r) => r.made).length;
        nbaShotSummary.textContent = `${rows.length} FGA · ${made} makes · ${rows.length ? ((made / rows.length) * 100).toFixed(1) : "0.0"} FG%`;

        const frag = document.createDocumentFragment();
        rows.forEach((shot) => {
          const el = document.createElement("span");
          el.className = `nba-shot ${shot.made ? "made" : "miss"}`;
          el.style.left = `${shot.cx}%`;
          el.style.top = `${shot.cy}%`;
          frag.appendChild(el);
        });
        nbaShotLayer.appendChild(frag);
      }

      function zonePercentageToColor(playerPct, leaguePct) {
        const RANGE = 0.15; // ±15% from league average
        const ratio = leaguePct > 0 ? (playerPct - leaguePct) / leaguePct : 0;
        const t = Math.max(-1, Math.min(1, ratio / RANGE)); // -1 = below avg, +1 = above avg
        // blue #2b59c3 — neutral #eceae4 — red #c62d2d (matches 3D scale: low=blue, high=red)
        const lerp = (a, b, f) => Math.round(a + (b - a) * f);
        const f = (t + 1) / 2; // map [-1,1] → [0,1]
        if (f < 0.5) {
          const s = f / 0.5;
          return `rgb(${lerp(43, 236, s)}, ${lerp(89, 234, s)}, ${lerp(195, 228, s)})`;
        } else {
          const s = (f - 0.5) / 0.5;
          return `rgb(${lerp(236, 198, s)}, ${lerp(234, 45, s)}, ${lerp(228, 45, s)})`;
        }
      }

      function colorNbaZones(zoneRows) {
        if (!nbaSvgZones) return;
        const tatum = zoneRows.find((r) => normalizeForSearch(r.player_name) === "jayson tatum");
        const league = zoneRows.find((r) => normalizeForSearch(r.player_name) === "league");
        if (!tatum || !league) return;
        nbaSvgZones.querySelectorAll("path[id]").forEach((path) => {
          const id = path.id;
          const zoneKey = Object.keys(nbaZoneMap).find((k) => nbaZoneMap[k] === id);
          if (!zoneKey) return;
          const playerPct = Number(tatum[`${zoneKey}_percentage`]);
          const leaguePct = Number(league[`${zoneKey}_percentage`]);
          if (Number.isFinite(playerPct) && Number.isFinite(leaguePct)) {
            path.style.fill = zonePercentageToColor(playerPct, leaguePct);
            path.style.fillOpacity = "0.8";
          }
        });
      }

      function renderNbaZoneStats(shots, zoneRows) {
        if (!nbaZoneStatsLayer) return;
        nbaZoneStatsLayer.innerHTML = "";
        const tatum = zoneRows.find((r) => normalizeForSearch(r.player_name) === "jayson tatum");
        const league = zoneRows.find((r) => normalizeForSearch(r.player_name) === "league");
        if (!tatum || !league) return;

        const frag = document.createDocumentFragment();
        Object.keys(nbaZoneMap).forEach((zoneKey) => {
          const pct = Number(tatum[`${zoneKey}_percentage`]);
          const lgPct = Number(league[`${zoneKey}_percentage`]);
          const zoneShots = shots.filter((s) => s.zone === zoneKey);
          const makes = zoneShots.filter((s) => s.made).length;
          const att = zoneShots.length;
          const pos = nbaZonePositions[zoneKey] || { x: 50, y: 50 };
          const stat = document.createElement("div");
          stat.className = "nba-zone-stat";
          stat.style.left = `${pos.x}%`;
          stat.style.top = `${pos.y}%`;
          stat.innerHTML = `
            <div class="fg">${Number.isFinite(pct) ? pct.toFixed(1) : "-"}%</div>
            <div class="att">${makes}/${att}</div>
            <div class="lg">Lg ${Number.isFinite(lgPct) ? lgPct.toFixed(1) : "-"}%</div>
          `;
          frag.appendChild(stat);
        });
        nbaZoneStatsLayer.appendChild(frag);
      }

      function toFinite(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function quantile(values, q) {
        if (!values.length) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const qq = clamp(q, 0, 1);
        const pos = (sorted.length - 1) * qq;
        const base = Math.floor(pos);
        const rest = pos - base;
        const next = sorted[Math.min(sorted.length - 1, base + 1)];
        return sorted[base] + rest * (next - sorted[base]);
      }

      function styleLabelFromShareKey(key) {
        const raw = String(key || "").replace(/^share_/, "");
        if (raw === "PRBallHandler") return "P&R Ball Handler";
        if (raw === "PRRollMan") return "P&R Roll Man";
        return raw;
      }

      function styleColorForKey(key) {
        const idx = nbaStyleShareKeys.indexOf(key);
        return nbaStylePalette[idx % nbaStylePalette.length];
      }

      function dist2(a, b) {
        const dx = toFinite(a.x) - toFinite(b.x);
        const dy = toFinite(a.y) - toFinite(b.y);
        return dx * dx + dy * dy;
      }

      function buildNbaStyleClusters(rows, requestedK = 6, maxIter = 50) {
        const pts = rows
          .map((r) => ({
            id: String(r.player_id || ""),
            x: toFinite(r.pc1),
            y: toFinite(r.pc2),
          }))
          .filter((p) => p.id);
        if (!pts.length) return { k: 0, clusters: [], byPlayerId: {} };

        const k = Math.max(2, Math.min(requestedK, Math.floor(Math.sqrt(pts.length))));
        const centroids = [];
        const firstIdx = pts.reduce((best, p, idx) => {
          if (best < 0) return idx;
          const b = pts[best];
          if (p.x < b.x) return idx;
          if (p.x === b.x && p.y < b.y) return idx;
          return best;
        }, -1);
        centroids.push({ x: pts[firstIdx].x, y: pts[firstIdx].y });
        while (centroids.length < k) {
          let best = null;
          pts.forEach((p) => {
            const d = Math.min(...centroids.map((c) => dist2(p, c)));
            if (!best || d > best.d) best = { p, d };
          });
          centroids.push({ x: best.p.x, y: best.p.y });
        }

        let assignments = new Array(pts.length).fill(0);
        for (let iter = 0; iter < maxIter; iter++) {
          let changed = false;
          for (let i = 0; i < pts.length; i++) {
            let bestK = 0;
            let bestD = Number.POSITIVE_INFINITY;
            for (let ci = 0; ci < centroids.length; ci++) {
              const d = dist2(pts[i], centroids[ci]);
              if (d < bestD) {
                bestD = d;
                bestK = ci;
              }
            }
            if (assignments[i] !== bestK) {
              assignments[i] = bestK;
              changed = true;
            }
          }
          const sums = Array.from({ length: k }, () => ({ x: 0, y: 0, n: 0 }));
          for (let i = 0; i < pts.length; i++) {
            const a = assignments[i];
            sums[a].x += pts[i].x;
            sums[a].y += pts[i].y;
            sums[a].n += 1;
          }
          for (let ci = 0; ci < k; ci++) {
            if (sums[ci].n > 0) {
              centroids[ci].x = sums[ci].x / sums[ci].n;
              centroids[ci].y = sums[ci].y / sums[ci].n;
            }
          }
          if (!changed) break;
        }

        const clusters = Array.from({ length: k }, (_, ci) => ({
          clusterId: ci,
          color: nbaStyleClusterColors[ci % nbaStyleClusterColors.length],
          points: [],
          centroid: { x: centroids[ci].x, y: centroids[ci].y },
          rx: 0,
          ry: 0,
        }));
        const byPlayerId = {};
        for (let i = 0; i < pts.length; i++) {
          const ci = assignments[i];
          const p = pts[i];
          clusters[ci].points.push(p);
          byPlayerId[p.id] = ci;
        }

        clusters.forEach((c) => {
          if (!c.points.length) {
            c.rx = 0.4;
            c.ry = 0.4;
            return;
          }
          const mx = c.points.reduce((s, p) => s + p.x, 0) / c.points.length;
          const my = c.points.reduce((s, p) => s + p.y, 0) / c.points.length;
          const sx = Math.sqrt(c.points.reduce((s, p) => s + (p.x - mx) ** 2, 0) / c.points.length);
          const sy = Math.sqrt(c.points.reduce((s, p) => s + (p.y - my) ** 2, 0) / c.points.length);
          c.centroid = { x: mx, y: my };
          c.rx = Math.max(0.25, sx * 2.35);
          c.ry = Math.max(0.25, sy * 2.35);
        });

        return { k, clusters, byPlayerId };
      }

      function renderNbaStyleScatter(selectedId, selectedCompIds) {
        if (!nbaStyleScatter || !nbaStyleProfiles.length) return;
        const width = 760;
        const height = 460;
        const margin = { top: 24, right: 20, bottom: 44, left: 44 };
        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;
        const xs = nbaStyleProfiles.map((r) => toFinite(r.pc1));
        const ys = nbaStyleProfiles.map((r) => toFinite(r.pc2));
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const spanX = Math.max(1e-6, maxX - minX);
        const spanY = Math.max(1e-6, maxY - minY);
        const padX = spanX * 0.08;
        const padY = spanY * 0.08;
        const x0 = minX - padX;
        const x1 = maxX + padX;
        const y0 = minY - padY;
        const y1 = maxY + padY;
        const xScale = (x) => margin.left + ((x - x0) / (x1 - x0)) * plotW;
        const yScale = (y) => margin.top + ((y1 - y) / (y1 - y0)) * plotH;
        const compSet = new Set(selectedCompIds.map((id) => String(id)));
        const byId = {};
        nbaStyleProfiles.forEach((row) => {
          const id = String(row.player_id || "");
          byId[id] = {
            id,
            name: String(row.player_name || ""),
            x: toFinite(row.pc1),
            y: toFinite(row.pc2),
            sx: xScale(toFinite(row.pc1)),
            sy: yScale(toFinite(row.pc2)),
            cluster: nbaStyleClusterData.byPlayerId[id],
          };
        });

        const meshEdgeSet = new Set();
        (nbaStyleClusterData.clusters || []).forEach((cluster) => {
          const clusterPoints = (cluster.points || []).map((p) => byId[p.id]).filter(Boolean);
          clusterPoints.forEach((p) => {
            const nearest = clusterPoints
              .filter((q) => q.id !== p.id)
              .map((q) => ({ id: q.id, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 }))
              .sort((a, b) => a.d - b.d)
              .slice(0, 3);
            nearest.forEach((n) => {
              const a = p.id < n.id ? p.id : n.id;
              const b = p.id < n.id ? n.id : p.id;
              meshEdgeSet.add(`${a}|${b}`);
            });
          });
        });

        const meshLines = Array.from(meshEdgeSet)
          .map((key) => {
            const [a, b] = key.split("|");
            const pa = byId[a];
            const pb = byId[b];
            if (!pa || !pb) return "";
            const cluster = pa.cluster;
            const color = nbaStyleClusterColors[Number(cluster) % nbaStyleClusterColors.length] || "#6b7280";
            return `<line x1="${pa.sx.toFixed(2)}" y1="${pa.sy.toFixed(2)}" x2="${pb.sx.toFixed(2)}" y2="${pb.sy.toFixed(2)}" stroke="${color}" stroke-opacity="0.18" stroke-width="0.9"></line>`;
          })
          .join("");

        const selectedLinks = (nbaStyleNeighborsById[selectedId] || [])
          .slice(0, Math.max(4, selectedCompIds.length))
          .map((n) => String(n.comp_player_id || ""))
          .filter((id) => byId[id])
          .map((id) => {
            const pa = byId[selectedId];
            const pb = byId[id];
            return `<line x1="${pa.sx.toFixed(2)}" y1="${pa.sy.toFixed(2)}" x2="${pb.sx.toFixed(2)}" y2="${pb.sy.toFixed(2)}" stroke="#4f6f95" stroke-opacity="0.82" stroke-width="1.5"></line>`;
          })
          .join("");

        const possVals = nbaStyleProfiles.map((r) => toFinite(r.total_possessions, 0));
        const minPoss = Math.min(...possVals);
        const maxPoss = Math.max(...possVals);
        const possRange = Math.max(1, maxPoss - minPoss);

        const pointHalos = nbaStyleProfiles
          .map((row) => {
            const id = String(row.player_id || "");
            const isSelected = id === selectedId;
            const isComp = compSet.has(id);
            const cx = xScale(toFinite(row.pc1));
            const cy = yScale(toFinite(row.pc2));
            const clusterId = nbaStyleClusterData.byPlayerId[id];
            const clusterColor = nbaStyleClusterColors[Number(clusterId) % nbaStyleClusterColors.length] || "#94a3b8";
            const possNorm = Math.sqrt((toFinite(row.total_possessions, minPoss) - minPoss) / possRange);
            const rCore = isSelected ? 7.2 : isComp ? 5.2 : 2.4 + possNorm * 3.0;
            const rHalo = rCore * (isSelected ? 2.5 : isComp ? 2.1 : 1.75);
            const haloOpacity = isSelected ? 0.22 : isComp ? 0.16 : 0.1;
            return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${rHalo.toFixed(2)}" fill="${clusterColor}" fill-opacity="${haloOpacity}"></circle>`;
          })
          .join("");

        const allPoints = nbaStyleProfiles
          .map((row) => {
            const id = String(row.player_id || "");
            const isSelected = id === selectedId;
            const isComp = compSet.has(id);
            const cx = xScale(toFinite(row.pc1));
            const cy = yScale(toFinite(row.pc2));
            const clusterId = nbaStyleClusterData.byPlayerId[id];
            const clusterColor = nbaStyleClusterColors[Number(clusterId) % nbaStyleClusterColors.length] || "#94a3b8";
            const possNorm = Math.sqrt((toFinite(row.total_possessions, minPoss) - minPoss) / possRange);
            const r = isSelected ? 7.2 : isComp ? 5.2 : 2.4 + possNorm * 3.0;
            const fill = isSelected ? "#0f172a" : clusterColor;
            const stroke = isSelected ? "#ffffff" : "none";
            const strokeWidth = isSelected ? 1.8 : 0;
            const opacity = isSelected ? "0.98" : isComp ? "0.93" : "0.84";
            return `<circle class="nba-style-point" data-player-id="${htmlEscape(id)}" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" fill-opacity="${opacity}"><title>${htmlEscape(row.player_name || "")}</title></circle>`;
          })
          .join("");

        const selectedLabel = (() => {
          if (!byId[selectedId]) return "";
          const text = String(byId[selectedId].name || "");
          const textW = Math.max(52, text.length * 7.1);
          const plotLeft = margin.left + 8;
          const plotRight = margin.left + plotW - 8;
          const px = byId[selectedId].sx + 12;
          const py = byId[selectedId].sy - 12;
          const x = Math.max(plotLeft, Math.min(plotRight - textW, px));
          const y = Math.max(margin.top + 14, Math.min(margin.top + plotH - 6, py));
          return `
            <text x="${x.toFixed(2)}" y="${(y + 2).toFixed(2)}" fill="#10243f" font-size="12" font-weight="800" letter-spacing="0.005em">${htmlEscape(text)}</text>
          `;
        })();

        const outerClusterLabels = (nbaStyleClusterData.clusters || [])
          .map((cluster, idx) => {
            const clusterNum = idx + 1;
            const name = nbaStyleClusterNames[clusterNum] || "Cluster";
            const labelText = `C${clusterNum} ${name}`;
            const pts = (cluster.points || []).map((p) => ({
              x: xScale(p.x),
              y: yScale(p.y),
            }));
            if (!pts.length) return "";
            const anchorCfg = nbaStyleClusterLabelAnchors[clusterNum];
            const defaultCfg = { x: 0.5, y: 0.5, anchor: "middle" };
            const cfg = anchorCfg || defaultCfg;
            const textW = Math.max(72, labelText.length * 6.8);
            const rawX = margin.left + plotW * cfg.x;
            const rawY = margin.top + plotH * cfg.y;
            const anchor = cfg.anchor || "middle";
            const leftPad = 8;
            const rightPad = 8;
            const minX = margin.left + leftPad + (anchor === "start" ? 0 : anchor === "middle" ? textW / 2 : textW);
            const maxX = margin.left + plotW - rightPad - (anchor === "start" ? textW : anchor === "middle" ? textW / 2 : 0);
            const labelX = Math.max(minX, Math.min(maxX, rawX));
            const labelY = Math.max(margin.top + 14, Math.min(margin.top + plotH - 6, rawY));
            const centroidX = xScale(cluster.centroid.x);
            const centroidY = yScale(cluster.centroid.y);
            return `
              <g>
                <line
                  x1="${centroidX.toFixed(2)}"
                  y1="${centroidY.toFixed(2)}"
                  x2="${labelX.toFixed(2)}"
                  y2="${(labelY - 6).toFixed(2)}"
                  stroke="${cluster.color}"
                  stroke-opacity="0.25"
                  stroke-width="1.15"
                ></line>
                <text
                  x="${labelX.toFixed(2)}"
                  y="${labelY.toFixed(2)}"
                  text-anchor="${anchor}"
                  fill="${cluster.color}"
                  font-size="11.5"
                  font-weight="800"
                  letter-spacing="0.008em"
                >${htmlEscape(labelText)}</text>
              </g>
            `;
          })
          .join("");

        nbaStyleScatter.innerHTML = `
          <defs>
            <linearGradient id="nba-style-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#eef4fb"></stop>
              <stop offset="100%" stop-color="#dfe9f6"></stop>
            </linearGradient>
            <filter id="nba-style-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="coloredBlur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="coloredBlur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
          </defs>
          <rect x="0" y="0" width="${width}" height="${height}" fill="url(#nba-style-bg)"></rect>
          <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="#f5f9ff" stroke="none"></rect>
          <g filter="url(#nba-style-glow)">${meshLines}</g>
          <g filter="url(#nba-style-glow)">${selectedLinks}</g>
          ${pointHalos}
          ${allPoints}
          ${outerClusterLabels}
          ${selectedLabel}
          <text x="${margin.left + 8}" y="${height - 12}" fill="#5b708e" font-size="11">PC1: possession-type mix axis</text>
          <text x="${margin.left + 238}" y="${height - 12}" fill="#5b708e" font-size="11">PC2: secondary style axis</text>
        `;
      }

      function styleMixBarHtml(row) {
        const parts = nbaStyleShareKeys
          .map((key) => ({ key, value: Math.max(0, toFinite(row[key])) }))
          .filter((p) => p.value > 0);
        if (!parts.length) return '<span class="nba-style-mix-empty">-</span>';

        const total = parts.reduce((sum, p) => sum + p.value, 0);
        let cursor = 0;
        const stops = parts
          .map((p) => {
            const span = total > 0 ? (p.value / total) * 100 : 0;
            const start = cursor;
            const end = Math.min(100, cursor + span);
            cursor = end;
            return `${styleColorForKey(p.key)} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
          })
          .join(", ");
        const tooltip = parts
          .map((p) => `${styleLabelFromShareKey(p.key)} ${(total > 0 ? (p.value / total) * 100 : 0).toFixed(1)}%`)
          .join(" · ");

        return `<span class="nba-style-mix" title="${htmlEscape(tooltip)}"><span class="nba-style-mix-pie" style="background:conic-gradient(${stops});"></span></span>`;
      }

      function closeNbaStyleSearchResults() {
        nbaStyleSearchResults?.classList.remove("open");
      }

      function renderNbaStyleSearchResults() {
        if (!nbaStyleProfiles.length || !nbaStyleSearchResults) return;
        const q = normalizeForSearch(nbaStylePlayerSearch?.value || "");
        const players = nbaStyleProfiles
          .filter((p) => {
            if (!q) return true;
            return normalizeForSearch(p.player_name).includes(q);
          })
          .sort((a, b) => {
            const qa = normalizeForSearch(a.player_name);
            const qb = normalizeForSearch(b.player_name);
            const aStarts = q && qa.startsWith(q) ? 0 : 1;
            const bStarts = q && qb.startsWith(q) ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
            const ap = toFinite(a.total_possessions, 0);
            const bp = toFinite(b.total_possessions, 0);
            if (bp !== ap) return bp - ap;
            return String(a.player_name || "").localeCompare(String(b.player_name || ""));
          })
          .slice(0, 12);

        if (!players.length) {
          nbaStyleSearchResults.innerHTML = "";
          closeNbaStyleSearchResults();
          return;
        }

        nbaStyleSearchResults.innerHTML = players
          .map((p) => {
            const pid = String(p.player_id || "");
            const headshot = nbaStyleHeadshotById[pid];
            const avatar = headshot
              ? `<span class="dpm-search-avatar"><img src="${htmlEscape(headshot)}" alt="${htmlEscape(p.player_name || "")}" loading="lazy" /></span>`
              : `<span class="dpm-search-avatar">${htmlEscape(initials(p.player_name || ""))}</span>`;
            const seasons = String(p.seasons || "");
            const poss = Math.round(toFinite(p.total_possessions, 0)).toLocaleString();
            return `
              <button type="button" class="dpm-search-option" data-style-pick="${htmlEscape(p.player_id)}" role="option">
                ${avatar}
                <span class="dpm-search-text">
                  <span class="dpm-search-name">${htmlEscape(p.player_name || "")}</span>
                  <span class="dpm-search-years">${htmlEscape(seasons)} · ${poss} poss</span>
                </span>
              </button>
            `;
          })
          .join("");
        nbaStyleSearchResults.classList.add("open");
      }

      function renderNbaStyleSimilarity() {
        if (!nbaStyleProfiles.length || !nbaStyleBody || !nbaStyleMeta) return;
        const selected = nbaStyleById[nbaStyleSelectedId];
        if (!selected) return;
        const clusterId = nbaStyleClusterData.byPlayerId[nbaStyleSelectedId];

        const neighbors = (nbaStyleNeighborsById[nbaStyleSelectedId] || []).slice(0, 8);
        const compIds = neighbors.map((n) => String(n.comp_player_id || ""));
        renderNbaStyleScatter(nbaStyleSelectedId, compIds);

        nbaStyleMeta.textContent =
          `${selected.player_name} · ${selected.seasons} · ${Math.round(toFinite(selected.total_possessions)).toLocaleString()} tracked possessions` +
          ` · Archetype: ${selected.style_archetype}` +
          ` · Cluster ${Number.isFinite(clusterId) ? clusterId + 1 : "-"}`;

        const selectedColor = nbaStyleClusterColors[Number(clusterId) % nbaStyleClusterColors.length] || "#111827";
        const selectedRow = `
          <tr class="nba-style-row nba-style-row-selected">
            <td>${htmlEscape(selected.player_name)}</td>
            <td>1.000</td>
            <td><span class="nba-style-cluster-pill" style="--cluster:${selectedColor}">C${Number.isFinite(clusterId) ? clusterId + 1 : "-"}</span> ${htmlEscape(selected.style_archetype)}</td>
            <td>${styleMixBarHtml(selected)}</td>
          </tr>
        `;
        const compRows = neighbors
          .map((n) => {
            const comp = nbaStyleById[String(n.comp_player_id || "")];
            if (!comp) return "";
            const compCluster = nbaStyleClusterData.byPlayerId[String(comp.player_id || "")];
            const compColor = nbaStyleClusterColors[Number(compCluster) % nbaStyleClusterColors.length] || "#6b7280";
            return `
              <tr class="nba-style-row" data-style-player="${htmlEscape(comp.player_id)}">
                <td>${htmlEscape(comp.player_name)}</td>
                <td>${toFinite(n.similarity).toFixed(3)}</td>
                <td><span class="nba-style-cluster-pill" style="--cluster:${compColor}">C${Number.isFinite(compCluster) ? compCluster + 1 : "-"}</span> ${htmlEscape(comp.style_archetype)}</td>
                <td>${styleMixBarHtml(comp)}</td>
              </tr>
            `;
          })
          .join("");

        nbaStyleBody.innerHTML = selectedRow + compRows;
      }

      function pickNbaStylePlayer(rawValue) {
        const val = String(rawValue || "").trim().toLowerCase();
        if (!val) return false;
        const exact = nbaStyleProfiles.find((r) => String(r.player_name || "").toLowerCase() === val);
        const partial = nbaStyleProfiles.find((r) => String(r.player_name || "").toLowerCase().includes(val));
        const picked = exact || partial;
        if (!picked) return false;
        nbaStyleSelectedId = String(picked.player_id || "");
        if (nbaStylePlayerSearch) nbaStylePlayerSearch.value = picked.player_name;
        closeNbaStyleSearchResults();
        renderNbaStyleSimilarity();
        return true;
      }

      async function initNbaStyleSimilarity() {
        if (!nbaStyleMeta || !nbaStyleBody) return;
        try {
          const [profilesRaw, simRaw, headshotsRaw] = await Promise.all([
            fetchCsvStrict(NBA_STYLE_PROFILE_URL),
            fetchCsvStrict(NBA_STYLE_SIMILARITY_URL),
            fetchCsvStrict(NBA_STYLE_HEADSHOTS_URL).catch(() => []),
          ]);
          nbaStyleProfiles = profilesRaw.map((row) => {
            const out = { ...row };
            Object.keys(out).forEach((k) => {
              if (k === "player_name" || k === "style_archetype" || k === "seasons" || k === "player_id") return;
              out[k] = toFinite(out[k], 0);
            });
            out.player_id = String(row.player_id || "");
            out.player_name = String(row.player_name || "").trim();
            return out;
          }).filter((r) => r.player_id && r.player_name);

          nbaStyleSimilarity = simRaw.map((row) => ({
            ...row,
            player_id: String(row.player_id || ""),
            comp_player_id: String(row.comp_player_id || ""),
            similarity: toFinite(row.similarity, 0),
            comp_rank: toFinite(row.comp_rank, 0),
          }));
          nbaStyleHeadshotById = Object.fromEntries(
            headshotsRaw
              .map((row) => ({
                id: String(row.player_id || "").trim(),
                path: String(row.headshot_path || "").trim(),
                ok: Number(row.headshot_available || 0) === 1,
              }))
              .filter((r) => r.id && r.ok && r.path)
              .map((r) => [r.id, r.path])
          );

          nbaStyleProfiles.sort((a, b) => {
            const pa = toFinite(a.total_possessions, 0);
            const pb = toFinite(b.total_possessions, 0);
            if (pb !== pa) return pb - pa;
            return String(a.player_name || "").localeCompare(String(b.player_name || ""));
          });
          nbaStyleById = Object.fromEntries(nbaStyleProfiles.map((r) => [r.player_id, r]));
          nbaStyleClusterData = buildNbaStyleClusters(nbaStyleProfiles, 6);
          nbaStyleShareKeys = Object.keys(nbaStyleProfiles[0] || {}).filter((k) => k.startsWith("share_")).sort((a, b) => {
            const av = nbaStyleProfiles.reduce((s, r) => s + toFinite(r[a]), 0);
            const bv = nbaStyleProfiles.reduce((s, r) => s + toFinite(r[b]), 0);
            return bv - av;
          });

          nbaStyleNeighborsById = {};
          nbaStyleSimilarity.forEach((row) => {
            if (!row.player_id || !row.comp_player_id) return;
            if (!nbaStyleNeighborsById[row.player_id]) nbaStyleNeighborsById[row.player_id] = [];
            nbaStyleNeighborsById[row.player_id].push(row);
          });
          Object.values(nbaStyleNeighborsById).forEach((list) => list.sort((a, b) => a.comp_rank - b.comp_rank));

          nbaStyleSelectedId = nbaStyleProfiles[0]?.player_id || "";
          if (nbaStylePlayerSearch && nbaStyleProfiles[0]) {
            nbaStylePlayerSearch.value = nbaStyleProfiles[0].player_name;
          }
          renderNbaStyleSearchResults();
          renderNbaStyleSimilarity();
        } catch (error) {
          nbaStyleMeta.textContent = `Failed to load style similarity data: ${error.message}`;
          nbaStyleBody.innerHTML = '<tr><td colspan="4">Style similarity data unavailable.</td></tr>';
          if (nbaStyleScatter) nbaStyleScatter.innerHTML = "";
        }
      }

      function computeGlobalColorScale(binRows) {
        // "All-Decades" bounds should span the extrema of decade scales:
        // global min = min(decade cMin), global max = max(decade cMax).
        const decadeScales = DECADE_ORDER
          .map((decade) => {
            const mesh = buildNbaBinsDecadeMesh(binRows, decade, null);
            if (!mesh) return null;
            return { cMin: mesh.cMin, cMax: mesh.cMax };
          })
          .filter(Boolean);

        if (!decadeScales.length) return { cMin: 0.9, cMax: 1.2 };

        const cMin = Math.min(...decadeScales.map((s) => s.cMin));
        const cMax = Math.max(...decadeScales.map((s) => s.cMax));
        return { cMin, cMax };
      }

      function buildNbaBinsDecadeMesh(binRows, decade, globalScale = null) {
        const PRIOR_ATTEMPTS = 20;
        const LOW_ATTEMPT_BLEND = 4;
        const rows = binRows
          .map((r) => ({
            decade: String(r.decade || ""),
            x: Number(r.x_center),
            y: Number(r.y_center),
            attempts: Number(r.attempts),
            pps: Number(r.pps),
          }))
          .filter((r) => r.decade === decade)
          .filter((r) => Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.attempts));
        if (!rows.length) return null;

        const xVals = Array.from(new Set(rows.map((r) => r.x))).sort((a, b) => a - b);
        const yVals = Array.from(new Set(rows.map((r) => r.y))).sort((a, b) => a - b);
        const xStep = xVals.length > 1 ? Math.min(...xVals.slice(1).map((v, i) => v - xVals[i])) : 20;
        const yStep = yVals.length > 1 ? Math.min(...yVals.slice(1).map((v, i) => v - yVals[i])) : 20;
        const BIN_SIZE = Math.max(2, Math.min(xStep, yStep));
        const xMid = (xVals[0] + xVals[xVals.length - 1]) / 2;
        const yMid = (yVals[0] + yVals[yVals.length - 1]) / 2;

        const weightedRows = rows.filter((r) => r.attempts > 0 && Number.isFinite(r.pps));
        const leaguePps =
          weightedRows.reduce((acc, r) => acc + r.pps * r.attempts, 0) /
            Math.max(1, weightedRows.reduce((acc, r) => acc + r.attempts, 0)) || 1.05;

        const adjustedRows = rows.map((r) => {
          const cx = r.x - xMid;
          const cy = r.y - yMid;
          if (!(r.attempts > 0) || !Number.isFinite(r.pps)) {
            return { ...r, cx, cy, adjPps: leaguePps };
          }
          // Empirical-Bayes shrinkage prevents tiny bins from dominating the color scale.
          const shrunk = (r.pps * r.attempts + leaguePps * PRIOR_ATTEMPTS) / (r.attempts + PRIOR_ATTEMPTS);
          const blend = Math.min(1, r.attempts / LOW_ATTEMPT_BLEND);
          return { ...r, cx, cy, adjPps: leaguePps + (shrunk - leaguePps) * blend };
        });

        function weightedQuantile(items, q) {
          if (!items.length) return leaguePps;
          const sorted = items
            .filter((r) => Number.isFinite(r.adjPps) && r.attempts > 0)
            .slice()
            .sort((a, b) => a.adjPps - b.adjPps);
          const totalW = sorted.reduce((acc, r) => acc + r.attempts, 0);
          let run = 0;
          for (const row of sorted) {
            run += row.attempts;
            if (run / totalW >= q) return row.adjPps;
          }
          return sorted[sorted.length - 1]?.adjPps ?? leaguePps;
        }

        const cxVals = Array.from(new Set(adjustedRows.map((r) => r.cx))).sort((a, b) => a - b);
        const cyVals = Array.from(new Set(adjustedRows.map((r) => r.cy))).sort((a, b) => a - b);
        const xIdx = new Map(cxVals.map((v, i) => [v, i]));
        const yIdx = new Map(cyVals.map((v, i) => [v, i]));
        const ppsGrid = Array.from({ length: cyVals.length }, () => Array(cxVals.length).fill(leaguePps));
        const attGrid = Array.from({ length: cyVals.length }, () => Array(cxVals.length).fill(0));
        adjustedRows.forEach((r) => {
          const ix = xIdx.get(r.cx);
          const iy = yIdx.get(r.cy);
          if (ix == null || iy == null) return;
          ppsGrid[iy][ix] = r.adjPps;
          attGrid[iy][ix] = Math.max(0, r.attempts);
        });

        // Gaussian neighborhood smoothing for color only (volume/height stays raw attempts).
        const radius = 2;
        const sigma2 = 1.2 * 1.2;
        const smoothedPpsByKey = new Map();
        adjustedRows.forEach((r) => {
          const ix = xIdx.get(r.cx);
          const iy = yIdx.get(r.cy);
          if (ix == null || iy == null) return;
          let num = 0;
          let den = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = ix + dx;
              const ny = iy + dy;
              if (nx < 0 || nx >= cxVals.length || ny < 0 || ny >= cyVals.length) continue;
              const dist2 = dx * dx + dy * dy;
              const kernel = Math.exp(-dist2 / (2 * sigma2));
              const attW = Math.sqrt(attGrid[ny][nx] + 1);
              const w = kernel * attW;
              num += ppsGrid[ny][nx] * w;
              den += w;
            }
          }
          const smooth = den > 0 ? num / den : r.adjPps;
          smoothedPpsByKey.set(`${r.cx}|${r.cy}`, smooth);
        });

        const colorRows = adjustedRows.map((r) => {
          const key = `${r.cx}|${r.cy}`;
          return { ...r, colorPps: smoothedPpsByKey.get(key) ?? r.adjPps };
        });

        const cMin = globalScale?.cMin ?? weightedQuantile(
          colorRows.map((r) => ({ ...r, adjPps: r.colorPps })),
          0.08
        );
        const cMax = globalScale?.cMax ?? weightedQuantile(
          colorRows.map((r) => ({ ...r, adjPps: r.colorPps })),
          0.92
        );
        const attemptRows = colorRows.filter((r) => r.attempts > 0);
        const attemptsSorted = attemptRows.map((r) => r.attempts).sort((a, b) => a - b);
        const idx99 = Math.min(attemptsSorted.length - 1, Math.floor(attemptsSorted.length * 0.99));
        const attemptsCap = Math.max(1, attemptsSorted[idx99] || 1);
        const zMax = Math.pow(attemptsCap, 0.8);

        const x = [];
        const y = [];
        const z = [];
        const i = [];
        const j = [];
        const k = [];
        const intensity = [];
        let totalAttempts = 0;

        function cubeMesh(row, baseIndex, zTop, pps) {
          const x0 = row.cx - BIN_SIZE / 2;
          const x1 = row.cx + BIN_SIZE / 2;
          const y0 = row.cy - BIN_SIZE / 2;
          const y1 = row.cy + BIN_SIZE / 2;
          x.push(x0, x1, x1, x0, x0, x1, x1, x0);
          y.push(y0, y0, y1, y1, y0, y0, y1, y1);
          z.push(0, 0, 0, 0, zTop, zTop, zTop, zTop);
          const tri = [
            [0, 1, 2], [0, 2, 3],
            [4, 5, 6], [4, 6, 7],
            [0, 1, 5], [0, 5, 4],
            [1, 2, 6], [1, 6, 5],
            [2, 3, 7], [2, 7, 6],
            [3, 0, 4], [3, 4, 7],
          ];
          tri.forEach((t) => {
            i.push(baseIndex + t[0]);
            j.push(baseIndex + t[1]);
            k.push(baseIndex + t[2]);
          });
          for (let n = 0; n < 8; n++) intensity.push(pps);
        }

        colorRows
          .filter((r) => r.attempts > 0)
          .forEach((r) => {
            totalAttempts += r.attempts;
            const zTop = Math.pow(Math.min(attemptsCap, r.attempts), 0.8);
            cubeMesh(r, x.length, zTop, r.colorPps);
          });

        const maxAbs = Math.max(
          Math.abs(cxVals[0] ?? 0),
          Math.abs(cxVals[cxVals.length - 1] ?? 0),
          Math.abs(cyVals[0] ?? 0),
          Math.abs(cyVals[cyVals.length - 1] ?? 0)
        );

        return {
          x, y, z, i, j, k, intensity,
          cMin, cMax, zMax, totalAttempts,
          axisRange: [-maxAbs - BIN_SIZE, maxAbs + BIN_SIZE],
        };
      }

      function renderNbaBinsPlot(binRows, decade, globalScale = null) {
        if (!nbaBinsPlot || typeof Plotly === "undefined") return;
        const SPIN_RADIUS = 1.80;
        const SPIN_Z = 1.45;
        const CAMERA_CENTER = { x: 0, y: 0, z: -0.12 };
        const defaultTheta = Math.PI / 4;
        const scaleKey = globalScale ? "all" : "decade";
        const cacheKey = `${decade}::${scaleKey}`;
        let mesh = nbaBinsRenderCache.get(cacheKey);
        if (!mesh) {
          mesh = buildNbaBinsDecadeMesh(binRows, decade, globalScale);
          if (mesh) nbaBinsRenderCache.set(cacheKey, mesh);
        }
        if (!mesh) return;
        if (nbaBinsSummary) {
          nbaBinsSummary.textContent = `${DECADE_YEAR_RANGES[decade] ?? decade} · ${mesh.totalAttempts.toLocaleString()} attempts`;
        }
        const legendMax = document.getElementById("nba-3d-legend-max");
        const legendMin = document.getElementById("nba-3d-legend-min");
        if (legendMax) legendMax.textContent = mesh.cMax.toFixed(2);
        if (legendMin) legendMin.textContent = mesh.cMin.toFixed(2);

        const existingCamera = nbaBinsPlot?._fullLayout?.scene?.camera;
        const chosenCamera = existingCamera || nbaLastCamera || {
          eye: {
            x: SPIN_RADIUS * Math.cos(defaultTheta),
            y: SPIN_RADIUS * Math.sin(defaultTheta),
            z: SPIN_Z,
          },
          center: CAMERA_CENTER,
        };
        if (Number.isFinite(chosenCamera?.eye?.x) && Number.isFinite(chosenCamera?.eye?.y)) {
          nbaSpinTheta = Math.atan2(chosenCamera.eye.y, chosenCamera.eye.x);
        } else if (!Number.isFinite(nbaSpinTheta)) {
          nbaSpinTheta = defaultTheta;
        }
        nbaLastCamera = {
          eye: {
            x: Number(chosenCamera?.eye?.x) || SPIN_RADIUS * Math.cos(defaultTheta),
            y: Number(chosenCamera?.eye?.y) || SPIN_RADIUS * Math.sin(defaultTheta),
            z: Number(chosenCamera?.eye?.z) || SPIN_Z,
          },
          center: {
            x: Number(chosenCamera?.center?.x) || CAMERA_CENTER.x,
            y: Number(chosenCamera?.center?.y) || CAMERA_CENTER.y,
            z: Number(chosenCamera?.center?.z) || CAMERA_CENTER.z,
          },
        };

        const layout = {
          margin: { l: 0, r: 0, b: 0, t: 0 },
          uirevision: "nba-bins-scene",
          paper_bgcolor: "#eef2f8",
          plot_bgcolor: "#eef2f8",
          scene: {
            xaxis: {
              visible: false,
              range: mesh.axisRange,
              showbackground: false,
              showgrid: false,
              zeroline: false,
            },
            yaxis: {
              visible: false,
              range: mesh.axisRange,
              showbackground: false,
              showgrid: false,
              zeroline: false,
            },
            zaxis: {
              title: "",
              range: [0, mesh.zMax * 1.08],
              showbackground: false,
              showgrid: false,
              zeroline: false,
              tickfont: { size: 10, color: "#65728a" },
              showticklabels: false,
            },
            aspectmode: "manual",
            domain: { x: [-0.15, 0.75], y: [0.05, 0.97] },
            aspectratio: { x: 1, y: 1, z: 0.86 },
            camera: nbaLastCamera,
            dragmode: "turntable",
          },
        };
        Plotly.react(
          nbaBinsPlot,
          [
            {
              type: "mesh3d",
              x: mesh.x,
              y: mesh.y,
              z: mesh.z,
              i: mesh.i,
              j: mesh.j,
              k: mesh.k,
              intensity: mesh.intensity,
              intensitymode: "vertex",
              cmin: mesh.cMin,
              cmax: mesh.cMax,
              colorscale: [
                [0.0, "#2b59c3"],
                [0.5, "#eceae4"],
                [1.0, "#c62d2d"],
              ],
              flatshading: false,
              opacity: 1,
              hoverinfo: "skip",
              showlegend: false,
              showscale: false,
            },
          ],
          layout,
          { displayModeBar: false, responsive: true }
        ).then(() => startNbaBinsSpin());
      }

      function prewarmNbaBinsCache(binRows, globalScale = null) {
        const scaleKey = globalScale ? "all" : "decade";
        DECADE_ORDER.forEach((decade) => {
          const cacheKey = `${decade}::${scaleKey}`;
          if (nbaBinsRenderCache.has(cacheKey)) return;
          const mesh = buildNbaBinsDecadeMesh(binRows, decade, globalScale);
          if (mesh) nbaBinsRenderCache.set(cacheKey, mesh);
        });
      }

      function startNbaBinsSpin() {
        if (!nbaBinsPlot || typeof Plotly === "undefined") return;
        if (nbaSpinTimer) return;
        // Fixed-elevation isometric orbit: same top-down angle, full 360 around center.
        const radius = 1.80;
        const zFixed = 1.45;
        if (!Number.isFinite(nbaSpinTheta)) nbaSpinTheta = Math.PI / 4;
        nbaSpinTimer = setInterval(() => {
          nbaSpinTheta += 0.016;
          const x = radius * Math.cos(nbaSpinTheta);
          const y = radius * Math.sin(nbaSpinTheta);
          nbaLastCamera = {
            eye: { x, y, z: zFixed },
            center: { x: 0, y: 0, z: -0.12 },
          };
          Plotly.relayout(nbaBinsPlot, {
            "scene.camera.eye.x": x,
            "scene.camera.eye.y": y,
            "scene.camera.eye.z": zFixed,
            "scene.camera.center.x": 0,
            "scene.camera.center.y": 0,
            "scene.camera.center.z": -0.12,
          }).catch(() => {});
        }, 45);
      }

      async function initNbaBinsPlot() {
        if (!nbaBinsPlot) return;
        try {
          if (!nbaLeagueBinsCache.length) {
            nbaLeagueBinsCache = await fetchCsvStrict(NBA_LEAGUE_BINS_URL);
          }
          nbaDecadeIdx = DECADE_ORDER.indexOf("2020s");
          nbaBinsRenderCache.clear();
          nbaGlobalScale = computeGlobalColorScale(nbaLeagueBinsCache);
          updateNbaDecade();
          updateNbaScaleMode();
          renderNbaBinsPlot(nbaLeagueBinsCache, DECADE_ORDER[nbaDecadeIdx], activeNbaScale());
          setTimeout(() => prewarmNbaBinsCache(nbaLeagueBinsCache, activeNbaScale()), 0);
        } catch (error) {
          if (nbaBinsSummary) nbaBinsSummary.textContent = `Failed to load bins: ${error.message}`;
        }
      }

      async function initNbaShotChart() {
        if (!nbaShotLayer || !nbaShotSummary) return;
        try {
          const [svgResponse, shotRows, zoneRows] = await Promise.all([
            fetch(NBA_ZONE_SVG_URL, { cache: "no-store" }),
            fetchCsvStrict(NBA_TATUM_SHOTS_URL),
            fetchCsvStrict(NBA_TATUM_ZONE_URL),
          ]);
          if (!svgResponse.ok) {
            throw new Error(`${NBA_ZONE_SVG_URL} returned HTTP ${svgResponse.status}`);
          }
          const svgText = await svgResponse.text();
          if (nbaSvgZones) nbaSvgZones.innerHTML = svgText;
          colorNbaZones(zoneRows);

          const shots = shotRows
            .filter((r) => normalizeForSearch(r.PLAYER_NAME) === "jayson tatum")
            .map((r) => {
              const x = Number(r.LOC_X);
              const y = Number(r.LOC_Y);
              if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
              const pos = transformShotCoordinate(x, y);
              return {
                cx: pos.x,
                cy: pos.y,
                rx: x,
                ry: y,
                made: Number(r.SHOT_MADE_FLAG) === 1,
                zone: r.zone,
              };
            })
            .filter(Boolean)
            .filter((s) => s.cx >= 0 && s.cx <= 100 && s.cy >= 0 && s.cy <= 100);
          nbaShotsCache = shots;
          renderNbaShotChart(shots);
          renderNbaZoneStats(shots, zoneRows);
        } catch (error) {
          nbaShotSummary.textContent = `Failed to load shot chart: ${error.message}`;
        }
      }

      function setSelectOptions(selectEl, options, selected = "") {
        const previous = selected || selectEl.value;
        selectEl.innerHTML = options
          .map((opt) => `<option value="${htmlEscape(opt.value)}">${htmlEscape(opt.label)}</option>`)
          .join("");
        if (options.some((opt) => opt.value === previous)) {
          selectEl.value = previous;
        }
      }

      function selectedWOWYPlayers() {
        return wowySelectedPlayers.slice(0, 2);
      }

      function buildWOWYPools(rows) {
        const teams = new Set();
        const byTeam = new Map();

        rows.forEach((row) => {
          const team = String(row.team || "");
          if (!team) return;
          teams.add(team);
          if (!byTeam.has(team)) byTeam.set(team, new Map());
          const pool = byTeam.get(team);
          (row.lineup_person_ids || []).forEach((pid, i) => {
            const id = String(pid || "");
            if (!id) return;
            const name = formatPlayerName((row.lineup || [])[i] || id);
            if (!pool.has(id)) {
              pool.set(id, { id, name, seconds: 0 });
            }
            pool.get(id).seconds += Number(row.seconds || 0);
          });
        });

        return { teams: Array.from(teams).sort((a, b) => a.localeCompare(b)), byTeam };
      }

      function wowyHeadshot(pid, name) {
        const src = wowyData?.headshots?.[pid];
        if (src) {
          return `<span class="wowy-avatar"><img src="${htmlEscape(src)}" alt="${htmlEscape(name)}" loading="lazy" /></span>`;
        }
        return `<span class="wowy-avatar">${htmlEscape(initials(name))}</span>`;
      }

      function renderWOWYSelected(playersMap) {
        if (!wowySelectedPlayers.length) {
          wowySelected.innerHTML = "";
          return;
        }
        wowySelected.innerHTML = wowySelectedPlayers
          .map((pid) => {
            const player = playersMap[pid];
            const name = player ? player.name : pid;
            return `
              <span class="wowy-selected-chip">
                ${wowyHeadshot(pid, name)}
                <span>${htmlEscape(name)}</span>
                <button type="button" data-remove-player="${htmlEscape(pid)}">×</button>
              </span>
            `;
          })
          .join("");
      }

      function toggleWOWYPlayer(pid) {
        const idx = wowySelectedPlayers.indexOf(pid);
        if (idx >= 0) {
          wowySelectedPlayers.splice(idx, 1);
        } else {
          if (wowySelectedPlayers.length >= 2) {
            wowySelectedPlayers.shift();
          }
          wowySelectedPlayers.push(pid);
        }
      }

      function renderWOWYPool() {
        if (!wowyData) return;
        const team = wowyTeam.value;
        const playersMap = wowyData.pools.byTeam[team] || {};
        const players = Object.values(playersMap).sort((a, b) => {
          if (b.seconds !== a.seconds) return b.seconds - a.seconds;
          return a.name.localeCompare(b.name);
        });

        wowyPool.innerHTML = players
          .map((player) => {
            const selected = wowySelectedPlayers.includes(player.id);
            const src = wowyData?.headshots?.[player.id];
            const head = src
              ? `<div class="head"><img src="${htmlEscape(src)}" alt="${htmlEscape(player.name)}" loading="lazy" /></div>`
              : `<div class="head">${htmlEscape(initials(player.name))}</div>`;
            return `
              <button type="button" class="wowy-player-btn ${selected ? "selected" : ""}" data-player-id="${htmlEscape(player.id)}">
                ${head}
                <div class="name">${htmlEscape(player.name)}</div>
                <div class="mins">${formatValue(player.seconds / 60, 0)} mins</div>
              </button>
            `;
          })
          .join("");

        renderWOWYSelected(playersMap);
      }

      function renderWOWYState(players, bits, playerNames) {
        return players
          .map((pid, i) => {
            const on = bits[i] === "1";
            const name = playerNames.get(pid) || formatPlayerName(pid);
            const lastName = lastNameOnly(name);
            return `
              <span class="wowy-player ${on ? "on" : "off"}">
                ${wowyHeadshot(pid, name)}
                <span class="wowy-player-name">${htmlEscape(lastName)}</span>
                <span class="wowy-player-tag">${on ? "ON" : "OFF"}</span>
              </span>
            `;
          })
          .join("");
      }

      function formatValue(value, decimals = 2) {
        if (typeof value !== "number") return "-";
        return value.toFixed(decimals);
      }

      function formatPercentile(value) {
        return Number.isFinite(value) ? `P${value}` : "-";
      }

      function buildPercentilesForMode(mode) {
        const rows = rapmData[mode];
        percentileKeys.forEach((key) => {
          const values = rows.map((row) => row[key]).filter((value) => typeof value === "number").sort((a, b) => a - b);
          percentileCache[mode][key] = values;
        });
      }

      function percentileFor(mode, key, value) {
        if (typeof value !== "number") return null;
        const values = percentileCache[mode][key] || [];
        if (!values.length) return null;

        let lo = 0;
        let hi = values.length - 1;
        let idx = -1;

        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (values[mid] <= value) {
            idx = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }

        if (idx < 0) return 0;
        if (values.length === 1) return 100;
        return Math.round((idx / (values.length - 1)) * 100);
      }

      function colorForValue(value, min, max) {
        if (typeof value !== "number" || min === max) {
          return "transparent";
        }

        const midpoint = 0;
        const lo = Math.min(min, midpoint);
        const hi = Math.max(max, midpoint);
        let t;

        if (value <= midpoint) {
          t = (value - lo) / (midpoint - lo || 1);
          const lightness = 88 - (1 - t) * 18;
          return `hsl(9 72% ${lightness}%)`;
        }

        t = (value - midpoint) / (hi - midpoint || 1);
        const lightness = 88 - t * 20;
        return `hsl(135 38% ${lightness}%)`;
      }

      function getColumnRange(rows, key) {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        rows.forEach((row) => {
          const value = row[key];
          if (typeof value === "number") {
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
        });

        if (!Number.isFinite(min) || !Number.isFinite(max)) {
          return { min: 0, max: 0 };
        }

        return { min, max };
      }

      function sortedRows(rows) {
        const directionFactor = rapmSort.direction === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => {
          const va = a[rapmSort.key];
          const vb = b[rapmSort.key];

          if (typeof va === "number" && typeof vb === "number") {
            return (va - vb) * directionFactor;
          }

          return String(va).localeCompare(String(vb)) * directionFactor;
        });
      }

      function renderSortIndicators() {
        document.querySelectorAll("#rapm-table th button").forEach((btn) => {
          const key = btn.dataset.sort;
          const arrow = key === rapmSort.key ? (rapmSort.direction === "asc" ? " ↑" : " ↓") : "";
          btn.textContent = `${btn.dataset.label}${arrow}`;
        });
      }

      function filteredRows(rows) {
        if (!rapmSearchQuery) return rows;
        return rows.filter((row) => row.playerSearch.includes(rapmSearchQuery));
      }

      function renderRAPMTable() {
        const modeRows = rapmData[rapmMode];
        const rows = filteredRows(modeRows);

        if (!rows.length) {
          rapmStatus.textContent = `No players found for "${rapmSearch.value.trim()}".`;
          rapmBody.innerHTML = '<tr><td colspan="7">No data available.</td></tr>';
          return;
        }

        const modeLabel = rapmMode === "luck" ? "luck-adjusted RAPM" : "raw RAPM";

        const ordered = sortedRows(rows);
        const rangeORapm = getColumnRange(modeRows, "oRAPM");
        const rangeDRapm = getColumnRange(modeRows, "dRAPM");
        const rangeNetRapm = getColumnRange(modeRows, "netRAPM");
        const rangeRawNet = getColumnRange(modeRows, "rawNetRating");

        rapmBody.innerHTML = ordered
          .map((row) => {
            const bgORapm = colorForValue(row.oRAPM, rangeORapm.min, rangeORapm.max);
            const bgDRapm = colorForValue(row.dRAPM, rangeDRapm.min, rangeDRapm.max);
            const bgNetRapm = colorForValue(row.netRAPM, rangeNetRapm.min, rangeNetRapm.max);
            const bgRawNet = colorForValue(row.rawNetRating, rangeRawNet.min, rangeRawNet.max);
            const pORapm = percentileFor(rapmMode, "oRAPM", row.oRAPM);
            const pDRapm = percentileFor(rapmMode, "dRAPM", row.dRAPM);
            const pNetRapm = percentileFor(rapmMode, "netRAPM", row.netRAPM);
            const pRawNet = percentileFor(rapmMode, "rawNetRating", row.rawNetRating);

            return `
              <tr>
                <td>${row.playerName ?? "-"}</td>
                <td>${row.teamName ?? "-"}</td>
                <td class="count">${row.games ?? "-"}</td>
                <td class="metric" style="background:${bgORapm}">
                  <span class="metric-main">${formatValue(row.oRAPM, 3)}</span>
                  <span class="metric-sub">${formatPercentile(pORapm)}</span>
                </td>
                <td class="metric" style="background:${bgDRapm}">
                  <span class="metric-main">${formatValue(row.dRAPM, 3)}</span>
                  <span class="metric-sub">${formatPercentile(pDRapm)}</span>
                </td>
                <td class="metric" style="background:${bgNetRapm}">
                  <span class="metric-main">${formatValue(row.netRAPM, 3)}</span>
                  <span class="metric-sub">${formatPercentile(pNetRapm)}</span>
                </td>
                <td class="metric" style="background:${bgRawNet}">
                  <span class="metric-main">${formatValue(row.rawNetRating, 1)}</span>
                  <span class="metric-sub">${formatPercentile(pRawNet)}</span>
                </td>
              </tr>
            `;
          })
          .join("");
      }

      function renderWOWYTable() {
        if (!wowyData) return;
        const allRows = wowyData.rows || [];
        const team = wowyTeam.value;
        const useLuck = wowyLuckToggle.checked;
        const rowsByTeam = allRows.filter((row) => row.team === team);
        const leagueRows = allRows;
        const players = selectedWOWYPlayers();

        if (!players.length) {
          wowyMeta.textContent = `Year ${wowyData.year} · ${team || "No team selected"} · select 1-2 players.`;
          wowyBody.innerHTML = '<tr><td colspan="5">Select at least one player to view WOWY states.</td></tr>';
          return;
        }

        const playerNames = new Map();
        const teamPool = wowyData?.pools?.byTeam?.[team] || {};
        Object.values(teamPool).forEach((player) => {
          playerNames.set(player.id, player.name);
        });
        rowsByTeam.forEach((row) => {
          (row.lineup_person_ids || []).forEach((pid, i) => {
            if (!playerNames.has(pid)) {
              playerNames.set(pid, formatPlayerName((row.lineup || [])[i] || pid));
            }
          });
        });

        const totalStates = Math.pow(2, players.length);
        const combos = new Map();
        for (let i = 0; i < totalStates; i++) {
          const key = i.toString(2).padStart(players.length, "0");
          combos.set(key, {
            key,
            seconds: 0,
            poss_for: 0,
            poss_against: 0,
            points_for: 0,
            points_against: 0,
            points_for_luck: 0,
            points_against_luck: 0,
            three_pa_for: 0,
            three_pm_for: 0,
            three_pa_against: 0,
            three_pm_against: 0,
            lineups: 0,
          });
        }

        rowsByTeam.forEach((row) => {
          const lineupSet = new Set((row.lineup_person_ids || []).map((pid) => String(pid)));
          const key = players.map((pid) => (lineupSet.has(pid) ? "1" : "0")).join("");
          const agg = combos.get(key);
          if (!agg) return;
          agg.seconds += Number(row.seconds || 0);
          agg.poss_for += Number(row.poss_for || 0);
          agg.poss_against += Number(row.poss_against || 0);
          agg.points_for += Number(row.points_for || 0);
          agg.points_against += Number(row.points_against || 0);
          agg.points_for_luck += Number(row.points_for_luck || 0);
          agg.points_against_luck += Number(row.points_against_luck || 0);
          agg.three_pa_for += Number(row.three_pa_for || 0);
          agg.three_pm_for += Number(row.three_pm_for || 0);
          agg.three_pa_against += Number(row.three_pa_against || 0);
          agg.three_pm_against += Number(row.three_pm_against || 0);
          agg.lineups += 1;
        });

        const rows = Array.from(combos.values()).sort((a, b) => b.seconds - a.seconds);
        const leagueTotals = leagueRows.reduce(
          (acc, row) => {
            const pointsFor = useLuck ? Number(row.points_for_luck || 0) : Number(row.points_for || 0);
            const pointsAgainst = useLuck ? Number(row.points_against_luck || 0) : Number(row.points_against || 0);
            acc.pointsFor += pointsFor;
            acc.pointsAgainst += pointsAgainst;
            acc.possFor += Number(row.poss_for || 0);
            acc.possAgainst += Number(row.poss_against || 0);
            return acc;
          },
          { pointsFor: 0, pointsAgainst: 0, possFor: 0, possAgainst: 0 }
        );

        const leagueOff = safeRate(leagueTotals.pointsFor, leagueTotals.possFor);
        const leagueDef = safeRate(leagueTotals.pointsAgainst, leagueTotals.possAgainst);

        function deltaClass(value) {
          if (!Number.isFinite(value)) return "neutral";
          if (value > 0) return "pos";
          if (value < 0) return "neg";
          return "neutral";
        }

        const rowMetrics = rows.map((row) => {
          const pointsFor = useLuck ? row.points_for_luck : row.points_for;
          const pointsAgainst = useLuck ? row.points_against_luck : row.points_against;
          const off = safeRate(pointsFor, row.poss_for);
          const def = safeRate(pointsAgainst, row.poss_against);
          const net = Number.isFinite(off) && Number.isFinite(def) ? off - def : null;
          const team3 = safePct(row.three_pm_for, row.three_pa_for);
          const opp3 = safePct(row.three_pm_against, row.three_pa_against);
          const offDelta = Number.isFinite(off) && Number.isFinite(leagueOff) ? off - leagueOff : null;
          const defDelta = Number.isFinite(def) && Number.isFinite(leagueDef) ? leagueDef - def : null;
          const netDelta = Number.isFinite(net) ? net : null;
          return { row, off, def, net, team3, opp3, offDelta, defDelta, netDelta };
        });

        wowyMeta.textContent =
          `Year ${wowyData.year} · ${team} · ${useLuck ? "Luck-adjusted" : "Raw"} · ${rowsByTeam.length} lineup rows` +
          ` · League Off ${Number.isFinite(leagueOff) ? formatValue(leagueOff, 1) : "-"} / Def ${Number.isFinite(leagueDef) ? formatValue(leagueDef, 1) : "-"}`;

        wowyBody.innerHTML = rowMetrics
          .map((m) => {
            return `
              <tr>
                <td class="wowy-state-col">
                  <div class="wowy-state">${renderWOWYState(players, m.row.key, playerNames)}</div>
                </td>
                <td class="wowy-value">
                  <span class="wowy-metric-main">${formatValue(m.row.seconds / 60, 1)}</span>
                  <span class="wowy-metric-faint">Lineups ${m.row.lineups}</span>
                </td>
                <td class="wowy-value">
                  <span class="wowy-metric-main">${Number.isFinite(m.off) ? formatValue(m.off, 1) : "-"}</span>
                  <span class="wowy-metric-sub ${deltaClass(m.offDelta)}">${formatSigned(m.offDelta, 1)}</span>
                  <span class="wowy-metric-faint">3P% ${fmtPct(m.team3, 1)}</span>
                </td>
                <td class="wowy-value">
                  <span class="wowy-metric-main">${Number.isFinite(m.def) ? formatValue(m.def, 1) : "-"}</span>
                  <span class="wowy-metric-sub ${deltaClass(m.defDelta)}">${formatSigned(m.defDelta, 1)}</span>
                  <span class="wowy-metric-faint">3P% ${fmtPct(m.opp3, 1)}</span>
                </td>
                <td class="wowy-value">
                  <span class="wowy-metric-main">${Number.isFinite(m.net) ? formatValue(m.net, 1) : "-"}</span>
                  <span class="wowy-metric-sub ${deltaClass(m.netDelta)}">${formatSigned(m.netDelta, 1)}</span>
                </td>
              </tr>
            `;
          })
          .join("");
      }

      function refreshWOWYPlayers() {
        if (!wowyData) return;
        const pools = wowyData.pools;
        const team = wowyTeam.value;
        const playersMap = pools.byTeam[team] || {};
        const sortedPlayers = Object.values(playersMap).sort((a, b) => {
          if (b.seconds !== a.seconds) return b.seconds - a.seconds;
          return a.name.localeCompare(b.name);
        });
        wowySelectedPlayers = sortedPlayers.slice(0, 1).map((p) => p.id);
        renderWOWYPool();
      }

      function selectedDpmPlayerIds() {
        return dpmSelectedIds.slice(0, 3);
      }

      function dpmYearsLabel(player) {
        const start = String(player?.startSeason || "").trim();
        const end = String(player?.endSeason || "").trim();
        if (start && end) {
          return start === end ? start : `${start} to ${end}`;
        }
        return "Years unavailable";
      }

      function dpmAvatar(player) {
        if (player?.headshot) {
          return `<span class="dpm-search-avatar"><img src="${htmlEscape(player.headshot)}" alt="${htmlEscape(player.name)}" loading="lazy" /></span>`;
        }
        return `<span class="dpm-search-avatar">${htmlEscape(initials(player?.name || ""))}</span>`;
      }

      function metricLabel(key) {
        if (key === "o") return "Off LeBron";
        if (key === "d") return "Def LeBron";
        return "Net LeBron";
      }

      function movingAverage(points, windowSize = 9) {
        if (points.length <= 2) return points;
        const out = [];
        const half = Math.floor(windowSize / 2);
        for (let i = 0; i < points.length; i++) {
          let sum = 0;
          let count = 0;
          for (let j = Math.max(0, i - half); j <= Math.min(points.length - 1, i + half); j++) {
            sum += points[j].y;
            count += 1;
          }
          out.push({ x: points[i].x, y: sum / count });
        }
        return out;
      }

      function niceStep(range, targetTicks = 6) {
        if (!Number.isFinite(range) || range <= 0) return 1;
        const rough = range / Math.max(2, targetTicks - 1);
        const power = 10 ** Math.floor(Math.log10(rough));
        const scaled = rough / power;
        let nice = 1;
        if (scaled > 5) nice = 10;
        else if (scaled > 2) nice = 5;
        else if (scaled > 1) nice = 2;
        return nice * power;
      }

      function buildYTicks(minY, maxY, targetTicks = 6) {
        const step = niceStep(maxY - minY, targetTicks);
        const start = Math.floor(minY / step) * step;
        const end = Math.ceil(maxY / step) * step;
        const ticks = [];
        for (let t = start; t <= end + step * 0.5; t += step) {
          ticks.push(Number(t.toFixed(6)));
        }
        if (!ticks.some((t) => Math.abs(t) < 1e-9)) {
          ticks.push(0);
          ticks.sort((a, b) => a - b);
        }
        return ticks;
      }

      function closeDpmSearchResults() {
        dpmSearchResults.classList.remove("open");
      }

      function renderDpmSearchResults() {
        if (!dpmData) return;
        const selected = new Set(dpmSelectedIds);
        const q = normalizeForSearch(dpmSearch.value);
        const players = (dpmData.players || [])
          .filter((p) => !selected.has(p.id))
          .filter((p) => !q || normalizeForSearch(p.name).includes(q))
          .sort((a, b) => {
            if (!q) {
              const aGames = Number(a.points?.[a.points.length - 1]?.g || 0);
              const bGames = Number(b.points?.[b.points.length - 1]?.g || 0);
              if (bGames !== aGames) return bGames - aGames;
              return a.name.localeCompare(b.name);
            }
            const an = normalizeForSearch(a.name);
            const bn = normalizeForSearch(b.name);
            const aStarts = an.startsWith(q) ? 0 : 1;
            const bStarts = bn.startsWith(q) ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
            return a.name.localeCompare(b.name);
          })
          .slice(0, 10);

        if (!players.length) {
          dpmSearchResults.innerHTML = "";
          closeDpmSearchResults();
          return;
        }

        dpmSearchResults.innerHTML = players
          .map(
            (p) => `
              <button type="button" class="dpm-search-option" data-dpm-pick="${htmlEscape(p.id)}" role="option">
                ${dpmAvatar(p)}
                <span class="dpm-search-text">
                  <span class="dpm-search-name">${htmlEscape(p.name)}</span>
                  <span class="dpm-search-years">${htmlEscape(dpmYearsLabel(p))}</span>
                </span>
              </button>
            `
          )
          .join("");
        dpmSearchResults.classList.add("open");
      }

      function renderDpmSelectedChips() {
        if (!dpmData) return;
        dpmSelectedChips.innerHTML = dpmSelectedIds
          .map((id, idx) => {
            const p = dpmData.playerById[id];
            if (!p) return "";
            const chipClass = dpmChipClass[idx % dpmChipClass.length];
            return `
              <span class="dpm-chip ${chipClass}">
                <span>${htmlEscape(p.name)}</span>
                <button type="button" data-dpm-remove="${htmlEscape(id)}">×</button>
              </span>
            `;
          })
          .join("");
        renderDpmSearchResults();
      }

      function addDpmPlayerById(playerId) {
        if (!dpmData) return;
        const id = String(playerId || "").trim();
        if (!id) return;
        const player = dpmData.playerById[id];
        if (!player) {
          dpmMeta.textContent = "Player not found in trajectory dataset.";
          return;
        }
        if (dpmSelectedIds.includes(player.id)) {
          dpmSearch.value = "";
          closeDpmSearchResults();
          return;
        }
        if (dpmSelectedIds.length >= 3) {
          dpmMeta.textContent = "Maximum 3 players can be compared.";
          return;
        }
        dpmSelectedIds.push(player.id);
        dpmSearch.value = "";
        closeDpmSearchResults();
        renderDpmSelectedChips();
        renderDpmChart();
      }

      function renderDpmChart() {
        if (!dpmData) return;
        const selectedIds = selectedDpmPlayerIds();
        const metric = dpmMetric.value || "n";
        const selectedPlayers = selectedIds
          .map((id) => dpmData.playerById[id])
          .filter(Boolean);

        if (!selectedPlayers.length) {
          dpmMeta.textContent = "Select up to 3 players to plot DPM trajectory.";
          dpmChart.innerHTML = "";
          dpmLegend.innerHTML = "";
          return;
        }

        const series = selectedPlayers.map((player, idx) => {
          const allPoints = (player.points || [])
            .map((p) => ({ x: Number(p.g), y: Number(p[metric]) }))
            .filter((p) => Number.isFinite(p.x))
            .sort((a, b) => a.x - b.x);
          const points = allPoints.filter((p) => Number.isFinite(p.y));
          const careerMaxX = allPoints.length ? allPoints[allPoints.length - 1].x : 0;
          return { id: player.id, name: player.name, color: dpmPalette[idx % dpmPalette.length], points, careerMaxX };
        });

        const hasPoints = series.some((s) => s.points.length > 0);
        if (!hasPoints) {
          dpmMeta.textContent = `No ${metricLabel(metric)} points available for selected players.`;
          dpmChart.innerHTML = "";
          dpmLegend.innerHTML = "";
          return;
        }

        const allPoints = series.flatMap((s) => s.points);
        const maxX = Math.max(1, ...series.map((s) => s.careerMaxX || 0));
        const minYPoint = Math.min(...allPoints.map((p) => p.y));
        const maxYPoint = Math.max(...allPoints.map((p) => p.y));
        let yMin = -3;
        let yMax = 3;
        if (minYPoint < -3) {
          const lowPad = Math.max(0.2, Math.abs(minYPoint) * 0.06);
          yMin = minYPoint - lowPad;
        }
        if (maxYPoint > 3) {
          const highPad = Math.max(0.2, Math.abs(maxYPoint) * 0.06);
          yMax = maxYPoint + highPad;
        }

        const width = 1200;
        const height = 460;
        const margin = { top: 18, right: 20, bottom: 58, left: 70 };
        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;
        const xScale = (x) => margin.left + (x / maxX) * plotW;
        const yScale = (y) => margin.top + ((yMax - y) / (yMax - yMin)) * plotH;

        const zeroY = yScale(0);
        const xStep = Math.max(1, Math.ceil(maxX / 8));
        const xTicks = [];
        for (let x = 0; x <= maxX; x += xStep) xTicks.push(x);
        if (xTicks[xTicks.length - 1] !== maxX) xTicks.push(maxX);
        const yTicks = buildYTicks(yMin, yMax, 6);

        const formatTick = (value) => {
          if (Math.abs(value) < 1e-9) return "0";
          if (Math.abs(value) >= 100 || Number.isInteger(value)) return String(Math.round(value));
          return value.toFixed(1).replace(/\.0$/, "");
        };

        const gridY = yTicks
          .map((t) => `<line x1="${margin.left}" y1="${yScale(t)}" x2="${margin.left + plotW}" y2="${yScale(t)}" stroke="${t === 0 ? "#b9c3d3" : "#dce2ec"}" stroke-width="${t === 0 ? 1.5 : 1}" stroke-dasharray="${t === 0 ? "6 4" : "3 6"}" />`)
          .join("");
        const gridX = xTicks
          .map((t) => `<line x1="${xScale(t)}" y1="${margin.top}" x2="${xScale(t)}" y2="${margin.top + plotH}" stroke="#e8edf4" stroke-width="1" />`)
          .join("");
        const xLabels = xTicks
          .map((t) => `<text x="${xScale(t)}" y="${height - 20}" text-anchor="middle" font-size="13" fill="#5a6578">${Math.round(t)}</text>`)
          .join("");
        const yLabels = yTicks
          .map((t) => `<text x="${margin.left - 10}" y="${yScale(t) + 4}" text-anchor="end" font-size="13" fill="#5a6578">${formatTick(t)}</text>`)
          .join("");

        const pointCloud = series
          .map((s) =>
            s.points
              .map((p) => `<circle cx="${xScale(p.x)}" cy="${yScale(p.y)}" r="3.3" fill="${s.color}" fill-opacity="0.28"></circle>`)
              .join("")
          )
          .join("");

        const linePaths = series
          .map((s) => {
            if (!s.points.length) return "";
            const smooth = movingAverage(s.points, 11);
            const d = smooth.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x).toFixed(2)} ${yScale(p.y).toFixed(2)}`).join(" ");
            const end = smooth[smooth.length - 1];
            const endX = xScale(end.x);
            const endY = yScale(end.y);
            return `
              <path d="${d}" fill="none" stroke="${s.color}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"></path>
              <circle cx="${endX}" cy="${endY}" r="4" fill="${s.color}"></circle>
            `;
          })
          .join("");

        dpmChart.innerHTML = `
          <rect x="0" y="0" width="${width}" height="${height}" fill="#f8fafc"></rect>
          ${gridX}
          ${gridY}
          ${pointCloud}
          ${linePaths}
          <line x1="${margin.left}" y1="${margin.top + plotH}" x2="${margin.left + plotW}" y2="${margin.top + plotH}" stroke="#c7d0de"></line>
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotH}" stroke="#c7d0de"></line>
          ${xLabels}
          ${yLabels}
          <text x="${margin.left + plotW / 2}" y="${height - 4}" text-anchor="middle" font-size="14" fill="#4a5568" font-weight="700">Career Game Number</text>
          <text x="22" y="${margin.top + plotH / 2}" text-anchor="middle" font-size="14" fill="#4a5568" font-weight="700" transform="rotate(-90 22 ${margin.top + plotH / 2})">${metricLabel(metric)}</text>
          <text x="${margin.left + 8}" y="${zeroY - 8}" font-size="12" fill="#55627a">0</text>
        `;

        dpmLegend.innerHTML = series
          .filter((s) => s.points.length)
          .map((s) => `<span class="dpm-legend-item"><span class="dpm-swatch" style="background:${s.color}"></span>${htmlEscape(s.name)}</span>`)
          .join("");

        dpmMeta.textContent = `Showing ${metricLabel(metric)} trajectory · 0-line fixed · ${selectedPlayers.length} player${selectedPlayers.length > 1 ? "s" : ""}.`;
      }

      async function initDpm() {
        try {
          dpmData = await fetchJsonStrict(DPM_URL);
          dpmData.players = (dpmData.players || []).slice().sort((a, b) => a.name.localeCompare(b.name));
          dpmData.playerById = Object.fromEntries(dpmData.players.map((p) => [p.id, p]));
          const bryce = dpmData.players.find((p) => normalizeForSearch(p.name) === "bryce cotton");
          dpmSelectedIds = bryce?.id ? [bryce.id] : dpmData.players[0]?.id ? [dpmData.players[0].id] : [];
          renderDpmSelectedChips();
          renderDpmChart();
        } catch (error) {
          dpmMeta.textContent = `Failed to load DPM data: ${error.message}`;
          dpmChart.innerHTML = "";
          dpmLegend.innerHTML = "";
        }
      }

      async function initWOWY() {
        try {
          wowyData = await fetchJsonStrict(WOWY_URL);
          const pools = buildWOWYPools(wowyData.rows || []);
          const byTeamObj = {};
          pools.byTeam.forEach((value, key) => {
            byTeamObj[key] = Object.fromEntries(value);
          });
          wowyData.pools = { teams: pools.teams, byTeam: byTeamObj };

          setSelectOptions(
            wowyTeam,
            pools.teams.map((team) => ({ value: team, label: team })),
            pools.teams[0] || ""
          );
          refreshWOWYPlayers();
          renderWOWYTable();
        } catch (error) {
          wowyMeta.textContent = `Failed to load WOWY data: ${error.message}`;
          wowyBody.innerHTML = '<tr><td colspan="5">WOWY data could not be loaded.</td></tr>';
        }
      }

      function setRapmMode(mode) {
        rapmMode = mode;
        toggleLuck.dataset.active = mode === "luck" ? "true" : "false";
        toggleRaw.dataset.active = mode === "raw" ? "true" : "false";
        renderRAPMTable();
      }

      document.querySelectorAll("#rapm-table th button").forEach((button) => {
        button.addEventListener("click", () => {
          const key = button.dataset.sort;
          if (rapmSort.key === key) {
            rapmSort.direction = rapmSort.direction === "asc" ? "desc" : "asc";
          } else {
            rapmSort.key = key;
            rapmSort.direction = key === "playerName" || key === "teamName" ? "asc" : "desc";
          }
          renderSortIndicators();
          renderRAPMTable();
        });
      });

      toggleLuck.addEventListener("click", () => setRapmMode("luck"));
      toggleRaw.addEventListener("click", () => setRapmMode("raw"));
      rapmSearch.addEventListener("input", (event) => {
        rapmSearchQuery = normalizeForSearch(event.target.value);
        renderRAPMTable();
      });
      wowyTeam.addEventListener("change", () => {
        refreshWOWYPlayers();
        renderWOWYTable();
      });
      wowyPool.addEventListener("click", (event) => {
        const button = event.target.closest("[data-player-id]");
        if (!button) return;
        const pid = String(button.getAttribute("data-player-id") || "");
        if (!pid) return;
        toggleWOWYPlayer(pid);
        renderWOWYPool();
        renderWOWYTable();
      });
      wowySelected.addEventListener("click", (event) => {
        const removeBtn = event.target.closest("[data-remove-player]");
        if (!removeBtn) return;
        const pid = String(removeBtn.getAttribute("data-remove-player") || "");
        if (!pid) return;
        wowySelectedPlayers = wowySelectedPlayers.filter((id) => id !== pid);
        renderWOWYPool();
        renderWOWYTable();
      });
      wowyLuckToggle.addEventListener("change", () => renderWOWYTable());
      dpmMetric.addEventListener("change", () => renderDpmChart());
      function updateNbaDecade() {
        nbaDecadePips.forEach((pip, i) => pip.classList.toggle("active", i === nbaDecadeIdx));
        if (nbaPrevBtn) nbaPrevBtn.disabled = nbaDecadeIdx === 0;
        if (nbaNextBtn) nbaNextBtn.disabled = nbaDecadeIdx === DECADE_ORDER.length - 1;
      }

      nbaDecadePips.forEach((pip, i) => {
        pip.style.cursor = "pointer";
        pip.addEventListener("click", () => {
          if (i === nbaDecadeIdx || !nbaLeagueBinsCache.length) return;
          nbaDecadeIdx = i;
          updateNbaDecade();
          renderNbaBinsPlot(nbaLeagueBinsCache, DECADE_ORDER[nbaDecadeIdx], activeNbaScale());
        });
      });

      function activeNbaScale() {
        return nbaScaleMode === "all" ? nbaGlobalScale : null;
      }

      function updateNbaScaleMode() {
        if (nbaScaleAllBtn) nbaScaleAllBtn.dataset.active = nbaScaleMode === "all" ? "true" : "false";
        if (nbaScaleDecadeBtn) nbaScaleDecadeBtn.dataset.active = nbaScaleMode === "decade" ? "true" : "false";
      }

      function setNbaScaleMode(mode) {
        if (mode !== "all" && mode !== "decade") return;
        if (nbaScaleMode === mode) return;
        nbaScaleMode = mode;
        updateNbaScaleMode();
        if (!nbaLeagueBinsCache.length) return;
        renderNbaBinsPlot(nbaLeagueBinsCache, DECADE_ORDER[nbaDecadeIdx], activeNbaScale());
        setTimeout(() => prewarmNbaBinsCache(nbaLeagueBinsCache, activeNbaScale()), 0);
      }

      nbaPrevBtn?.addEventListener("click", () => {
        if (nbaDecadeIdx > 0) {
          nbaDecadeIdx--;
          updateNbaDecade();
          renderNbaBinsPlot(nbaLeagueBinsCache, DECADE_ORDER[nbaDecadeIdx], activeNbaScale());
        }
      });

      nbaNextBtn?.addEventListener("click", () => {
        if (nbaDecadeIdx < DECADE_ORDER.length - 1) {
          nbaDecadeIdx++;
          updateNbaDecade();
          renderNbaBinsPlot(nbaLeagueBinsCache, DECADE_ORDER[nbaDecadeIdx], activeNbaScale());
        }
      });
      nbaScaleAllBtn?.addEventListener("click", () => setNbaScaleMode("all"));
      nbaScaleDecadeBtn?.addEventListener("click", () => setNbaScaleMode("decade"));
      nbaStylePlayerSearch?.addEventListener("focus", () => renderNbaStyleSearchResults());
      nbaStylePlayerSearch?.addEventListener("input", () => renderNbaStyleSearchResults());
      nbaStylePlayerSearch?.addEventListener("change", () => {
        if (!pickNbaStylePlayer(nbaStylePlayerSearch.value) && nbaStyleProfiles.length) {
          nbaStylePlayerSearch.value = nbaStyleById[nbaStyleSelectedId]?.player_name || "";
        }
      });
      nbaStylePlayerSearch?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const first = nbaStyleSearchResults?.querySelector("[data-style-pick]");
          if (first) {
            const pid = String(first.getAttribute("data-style-pick") || "");
            if (pid && nbaStyleById[pid]) {
              nbaStyleSelectedId = pid;
              nbaStylePlayerSearch.value = nbaStyleById[pid].player_name || "";
              closeNbaStyleSearchResults();
              renderNbaStyleSimilarity();
              return;
            }
          }
          if (!pickNbaStylePlayer(nbaStylePlayerSearch.value) && nbaStyleProfiles.length) {
            nbaStylePlayerSearch.value = nbaStyleById[nbaStyleSelectedId]?.player_name || "";
          }
        }
      });
      nbaStyleSearchResults?.addEventListener("click", (event) => {
        const pick = event.target.closest("[data-style-pick]");
        if (!pick) return;
        const pid = String(pick.getAttribute("data-style-pick") || "");
        if (!pid || !nbaStyleById[pid]) return;
        nbaStyleSelectedId = pid;
        if (nbaStylePlayerSearch) nbaStylePlayerSearch.value = nbaStyleById[pid].player_name || "";
        closeNbaStyleSearchResults();
        renderNbaStyleSimilarity();
      });
      nbaStyleScatter?.addEventListener("click", (event) => {
        const point = event.target.closest(".nba-style-point");
        if (!point) return;
        const pid = String(point.getAttribute("data-player-id") || "");
        if (!pid || !nbaStyleById[pid]) return;
        nbaStyleSelectedId = pid;
        if (nbaStylePlayerSearch) nbaStylePlayerSearch.value = nbaStyleById[pid].player_name || "";
        renderNbaStyleSimilarity();
      });
      nbaStyleBody?.addEventListener("click", (event) => {
        const row = event.target.closest("[data-style-player]");
        if (!row) return;
        const pid = String(row.getAttribute("data-style-player") || "");
        if (!pid || !nbaStyleById[pid]) return;
        nbaStyleSelectedId = pid;
        if (nbaStylePlayerSearch) nbaStylePlayerSearch.value = nbaStyleById[pid].player_name || "";
        renderNbaStyleSimilarity();
      });
      dpmSearch.addEventListener("focus", () => renderDpmSearchResults());
      dpmSearch.addEventListener("input", () => renderDpmSearchResults());
      dpmSearch.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const first = dpmSearchResults.querySelector("[data-dpm-pick]");
          if (first) {
            addDpmPlayerById(first.getAttribute("data-dpm-pick"));
          }
        }
      });
      dpmSearchResults.addEventListener("click", (event) => {
        const pick = event.target.closest("[data-dpm-pick]");
        if (!pick) return;
        addDpmPlayerById(String(pick.getAttribute("data-dpm-pick") || ""));
      });
      dpmSelectedChips.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-dpm-remove]");
        if (!remove) return;
        const id = String(remove.getAttribute("data-dpm-remove") || "");
        if (!id) return;
        dpmSelectedIds = dpmSelectedIds.filter((pid) => pid !== id);
        renderDpmSelectedChips();
        renderDpmChart();
      });
      document.addEventListener("click", (event) => {
        if (!event.target.closest(".dpm-search-wrap")) closeDpmSearchResults();
        if (!event.target.closest(".nba-style-search-wrap")) closeNbaStyleSearchResults();
      });

      async function initRAPM() {
        try {
          const [raw, luck] = await Promise.all([
            fetchJsonStrict(RAPM_SOURCES.raw),
            fetchJsonStrict(RAPM_SOURCES.luck)
          ]);

          rapmData.raw = normalizeRows(raw);
          rapmData.luck = normalizeRows(luck);
          buildPercentilesForMode("raw");
          buildPercentilesForMode("luck");

          renderSortIndicators();
          setRapmMode("luck");
        } catch (error) {
          rapmStatus.textContent = `Failed to load RAPM data: ${error.message}`;
          rapmBody.innerHTML = '<tr><td colspan="7">Could not load data from analytics/data.</td></tr>';
        }
      }

      initRAPM();
      initWOWY();
      initDpm();
      initNbaShotChart();
      initNbaBinsPlot();
      initNbaStyleSimilarity();
