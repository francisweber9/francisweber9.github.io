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

      const subTabs = document.querySelectorAll(".subtab");
      const subPanes = [
        document.getElementById("subpane-rapm"),
        document.getElementById("subpane-wowy"),
        document.getElementById("subpane-lineup")
      ];

      function activateSubTab(targetPane) {
        subTabs.forEach((tab) => {
          const active = tab.dataset.pane === targetPane;
          tab.setAttribute("aria-selected", active ? "true" : "false");
        });

        subPanes.forEach((pane) => {
          pane.classList.toggle("active", pane.id === `subpane-${targetPane}`);
        });
      }

      subTabs.forEach((tab) => {
        tab.addEventListener("click", () => activateSubTab(tab.dataset.pane));
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
      let wowyData = null;

      const wowyTeam = document.getElementById("wowy-team");
      const wowyLuckToggle = document.getElementById("wowy-luck-toggle");
      const wowyMeta = document.getElementById("wowy-meta");
      const wowyBody = document.getElementById("wowy-body");
      const wowyPool = document.getElementById("wowy-pool");
      const wowySelected = document.getElementById("wowy-selected");

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
            return `
              <span class="wowy-player ${on ? "on" : "off"}">
                ${wowyHeadshot(pid, name)}
                <span>${htmlEscape(name)} ${on ? "ON" : "OFF"}</span>
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
        rapmStatus.textContent = `Showing ${modeLabel} (${rows.length}/${modeRows.length} players)`;

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
          wowyBody.innerHTML = '<tr><td colspan="8">Select at least one player to view WOWY states.</td></tr>';
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

        function metricBg(delta, maxAbs) {
          if (!Number.isFinite(delta) || !Number.isFinite(maxAbs) || maxAbs <= 0) return "";
          const strength = Math.min(Math.abs(delta) / maxAbs, 1);
          if (delta >= 0) {
            return `background: hsl(135 38% ${95 - strength * 16}%);`;
          }
          return `background: hsl(9 72% ${95 - strength * 14}%);`;
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

        const maxAbsOff = Math.max(1, ...rowMetrics.map((m) => Math.abs(m.offDelta || 0)));
        const maxAbsDef = Math.max(1, ...rowMetrics.map((m) => Math.abs(m.defDelta || 0)));
        const maxAbsNet = Math.max(1, ...rowMetrics.map((m) => Math.abs(m.netDelta || 0)));

        wowyMeta.textContent =
          `Year ${wowyData.year} · ${team} · ${useLuck ? "Luck-adjusted" : "Raw"} · ${rowsByTeam.length} lineup rows` +
          ` · League Off ${Number.isFinite(leagueOff) ? formatValue(leagueOff, 1) : "-"} / Def ${Number.isFinite(leagueDef) ? formatValue(leagueDef, 1) : "-"}`;

        wowyBody.innerHTML = rowMetrics
          .map((m) => {
            return `
              <tr>
                <td><div class="wowy-state">${renderWOWYState(players, m.row.key, playerNames)}</div></td>
                <td class="wowy-value">${formatValue(m.row.seconds / 60, 1)}</td>
                <td class="wowy-value" style="${metricBg(m.offDelta, maxAbsOff)}">${Number.isFinite(m.off) ? formatValue(m.off, 1) : "-"}</td>
                <td class="wowy-value" style="${metricBg(m.defDelta, maxAbsDef)}">${Number.isFinite(m.def) ? formatValue(m.def, 1) : "-"}</td>
                <td class="wowy-value" style="${metricBg(m.netDelta, maxAbsNet)}">${Number.isFinite(m.net) ? formatValue(m.net, 1) : "-"}</td>
                <td class="wowy-value">${fmtPct(m.team3, 1)}</td>
                <td class="wowy-value">${fmtPct(m.opp3, 1)}</td>
                <td class="wowy-value">${m.row.lineups}</td>
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
          wowyBody.innerHTML = '<tr><td colspan="8">WOWY data could not be loaded.</td></tr>';
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
