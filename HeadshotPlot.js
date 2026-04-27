// Headshot scatter plot — TS% vs PPG with player headshot markers.
// Removed from app.js / index.html to avoid loading overhead.
// To restore: add <script src="HeadshotPlot.js" defer></script> to index.html,
// reinstate the SVG/button markup in subpane-headshots, and call initNbaHeadshotGraph().

const NBA_HEADSHOT_TS_PPG_URL = "analytics/data/nba/headshot_ts_ppg_2025.csv";

let nbaHeadshotRows = [];

function renderNbaHeadshotGraph() {
  const nbaHeadshotScatter = document.getElementById("nba-headshot-scatter");
  const nbaHeadshotMeta = document.getElementById("nba-headshot-meta");
  const nbaHeadshotDownload = document.getElementById("nba-headshot-download");
  if (!nbaHeadshotScatter || !nbaHeadshotMeta) return;
  const minGames = 50;
  const xMin = 4;
  const xMax = 35;
  const yMin = 0.35;
  const yMax = 0.75;
  const rows = nbaHeadshotRows
    .filter((r) => String(r.headshot_available || "0") === "1")
    .filter((r) => String(r.headshot_path || "").trim())
    .filter((r) => toFinite(r.gp, 0) >= minGames)
    .filter((r) => {
      const ppg = toFinite(r.ppg, -1);
      const ts = toFinite(r.ts_pct, -1);
      return ppg >= xMin && ppg <= xMax && ts >= yMin && ts <= yMax;
    })
    .sort((a, b) => toFinite(a.gp, 0) - toFinite(b.gp, 0));

  if (!rows.length) {
    nbaHeadshotMeta.textContent = "No players available for this filter.";
    nbaHeadshotScatter.innerHTML = "";
    return;
  }

  const width = 820;
  const height = 620;
  const margin = { top: 44, right: 26, bottom: 100, left: 100 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const xVals = rows.map((r) => toFinite(r.ppg, 0));
  const yVals = rows.map((r) => toFinite(r.ts_pct, 0));
  const xMid = xVals.reduce((s, x) => s + x, 0) / xVals.length;
  const yMid = yVals.reduce((s, y) => s + y, 0) / yVals.length;
  const xScale = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const yScale = (y) => margin.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const x0 = xScale(xMid);
  const y0 = yScale(yMid);
  const scaledPts = rows.map((r) => ({
    x: xScale(toFinite(r.ppg, 0)),
    y: yScale(toFinite(r.ts_pct, 0)),
  }));

  const ticksX = 6;
  const ticksY = 6;
  const xTickLabels = Array.from({ length: ticksX }, (_, i) => xMin + ((xMax - xMin) * i) / (ticksX - 1));
  const yTickLabels = Array.from({ length: ticksY }, (_, i) => yMin + ((yMax - yMin) * i) / (ticksY - 1));

  const xGrid = xTickLabels
    .map((v) => {
      const x = xScale(v);
      return `<line x1="${x.toFixed(2)}" y1="${margin.top}" x2="${x.toFixed(2)}" y2="${(margin.top + plotH).toFixed(2)}" stroke="#c8d3e3" stroke-opacity="0.42" stroke-width="1"></line>`;
    })
    .join("");
  const yGrid = yTickLabels
    .map((v) => {
      const y = yScale(v);
      return `<line x1="${margin.left}" y1="${y.toFixed(2)}" x2="${(margin.left + plotW).toFixed(2)}" y2="${y.toFixed(2)}" stroke="#c8d3e3" stroke-opacity="0.42" stroke-width="1"></line>`;
    })
    .join("");

  const xAxisLabels = xTickLabels
    .map((v) => {
      const x = xScale(v);
      return `<text x="${x.toFixed(2)}" y="${(height - 36).toFixed(2)}" text-anchor="middle" fill="#55657d" font-size="12">${v.toFixed(1)}</text>`;
    })
    .join("");
  const yAxisLabels = yTickLabels
    .map((v) => {
      const y = yScale(v);
      return `<text x="${(margin.left - 18).toFixed(2)}" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="#55657d" font-size="12">${(v * 100).toFixed(1)}%</text>`;
    })
    .join("");

  const defs = [];
  function quadrantBlob(points, color, key) {
    if (!points.length) return { def: "", shape: "" };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const spanX = Math.max(20, maxX - minX);
    const spanY = Math.max(20, maxY - minY);
    const rx = clamp(spanX * 0.58 + 34, 90, plotW * 0.48);
    const ry = clamp(spanY * 0.58 + 30, 84, plotH * 0.46);
    const gid = `hs-q-blob-${key}`;
    return {
      def: `
        <radialGradient id="${gid}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.35"></stop>
          <stop offset="55%" stop-color="${color}" stop-opacity="0.14"></stop>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"></stop>
        </radialGradient>
      `,
      shape: `<ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="url(#${gid})"></ellipse>`,
    };
  }

  const tlPts = scaledPts.filter((p) => p.x <= x0 && p.y <= y0);
  const trPts = scaledPts.filter((p) => p.x > x0 && p.y <= y0);
  const blPts = scaledPts.filter((p) => p.x <= x0 && p.y > y0);
  const brPts = scaledPts.filter((p) => p.x > x0 && p.y > y0);
  const blobs = [
    quadrantBlob(tlPts, "#f2b236", "tl"),
    quadrantBlob(trPts, "#4bc777", "tr"),
    quadrantBlob(blPts, "#eb5f74", "bl"),
    quadrantBlob(brPts, "#c86ee8", "br"),
  ];
  const blobDefs = blobs.map((b) => b.def).join("");
  const blobShapes = blobs.map((b) => b.shape).join("");
  const fixedR = 20;
  const points = rows
    .map((row, idx) => {
      const x = xScale(toFinite(row.ppg, 0));
      const y = yScale(toFinite(row.ts_pct, 0));
      const r = fixedR;
      const cid = `hs-clip-${idx}-${String(row.player_id || "")}`;
      const stroke = "#d6deeb";
      const title = `${row.player_name} · ${toFinite(row.ppg).toFixed(1)} PPG · ${(toFinite(row.ts_pct) * 100).toFixed(1)} TS% · ${Math.round(toFinite(row.gp))} GP`;

      if (row.headshot_available === "1" || row.headshot_available === 1) {
        defs.push(`<clipPath id="${cid}"><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(r - 0.9).toFixed(2)}"></circle></clipPath>`);
        return `
          <g>
            <image href="${htmlEscape(String(row.headshot_path || ""))}" x="${(x - r).toFixed(2)}" y="${(y - r).toFixed(2)}" width="${(2 * r).toFixed(2)}" height="${(2 * r).toFixed(2)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})"></image>
            <title>${htmlEscape(title)}</title>
          </g>
        `;
      }
      const initialsText = initials(String(row.player_name || ""));
      return `
        <g>
          <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(r - 0.9).toFixed(2)}" fill="#d8e4f7" stroke="${stroke}" stroke-width="1.1"></circle>
          <text x="${x.toFixed(2)}" y="${(y + 3.7).toFixed(2)}" text-anchor="middle" fill="#1f3251" font-size="${Math.max(8, r * 0.56).toFixed(1)}" font-weight="700">${htmlEscape(initialsText)}</text>
          <title>${htmlEscape(title)}</title>
        </g>
      `;
    })
    .join("");

  const avgPpg = xVals.reduce((s, x) => s + x, 0) / xVals.length;
  const avgTs = yVals.reduce((s, y) => s + y, 0) / yVals.length;
  nbaHeadshotMeta.textContent = `${rows.length} players (${minGames}+ GP) · Avg ${avgPpg.toFixed(1)} PPG · Avg ${(avgTs * 100).toFixed(1)} TS%`;

  nbaHeadshotScatter.innerHTML = `
    <defs>
      <linearGradient id="hs-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#eff5ff"></stop>
        <stop offset="100%" stop-color="#e6eef9"></stop>
      </linearGradient>
      ${blobDefs}
      ${defs.join("")}
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" fill="url(#hs-bg)"></rect>
    <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="#f4f8ff" opacity="0.35"></rect>
    <text x="${(margin.left + plotW / 2).toFixed(2)}" y="24" text-anchor="middle" fill="#405777" font-size="14" font-weight="700">2025-26 NBA Scoring Profile</text>
    ${blobShapes}
    ${xGrid}
    ${yGrid}
    <line x1="${x0.toFixed(2)}" y1="${margin.top}" x2="${x0.toFixed(2)}" y2="${(margin.top + plotH).toFixed(2)}" stroke="#8ea1bd" stroke-width="1.3" stroke-dasharray="6 5" stroke-opacity="0.7"></line>
    <line x1="${margin.left}" y1="${y0.toFixed(2)}" x2="${(margin.left + plotW).toFixed(2)}" y2="${y0.toFixed(2)}" stroke="#8ea1bd" stroke-width="1.3" stroke-dasharray="6 5" stroke-opacity="0.7"></line>
    ${points}
    <text x="${(margin.left + 14).toFixed(2)}" y="${(margin.top + 20).toFixed(2)}" fill="#9a6a16" font-size="12" font-weight="700">Efficient Role Players</text>
    <text x="${(margin.left + plotW - 14).toFixed(2)}" y="${(margin.top + 20).toFixed(2)}" text-anchor="end" fill="#1f8c4b" font-size="12" font-weight="700">Efficient Volume Scorers</text>
    <text x="${(margin.left + 14).toFixed(2)}" y="${(margin.top + plotH - 12).toFixed(2)}" fill="#b53e52" font-size="12" font-weight="700">Inefficient Role Players</text>
    <text x="${(margin.left + plotW - 14).toFixed(2)}" y="${(margin.top + plotH - 12).toFixed(2)}" text-anchor="end" fill="#8d53c2" font-size="12" font-weight="700">Inefficient Volume Scorers</text>
    ${xAxisLabels}
    ${yAxisLabels}
    <text x="${(margin.left + plotW / 2).toFixed(2)}" y="${(height - 14).toFixed(2)}" text-anchor="middle" fill="#405777" font-size="13" font-weight="700">Points Per Game (PPG)</text>
    <text x="30" y="${(margin.top + plotH / 2).toFixed(2)}" transform="rotate(-90 30 ${(margin.top + plotH / 2).toFixed(2)})" text-anchor="middle" fill="#405777" font-size="13" font-weight="700">True Shooting % (TS%)</text>
    <text x="${(width - 18).toFixed(2)}" y="${(height - 14).toFixed(2)}" text-anchor="end" fill="#8a95a8" font-size="11" font-weight="600" opacity="0.85">francisweber9.github.io</text>
  `;

  if (nbaHeadshotDownload) {
    nbaHeadshotDownload.disabled = false;
    nbaHeadshotDownload.addEventListener("click", async () => {
      const originalText = nbaHeadshotDownload.textContent;
      nbaHeadshotDownload.disabled = true;
      nbaHeadshotDownload.textContent = "Saving...";
      try {
        await downloadSvgAsPng(nbaHeadshotScatter, "nba_headshot_plot_fullres.png", 3);
      } catch (error) {
        console.error(error);
      } finally {
        nbaHeadshotDownload.textContent = originalText;
        nbaHeadshotDownload.disabled = !nbaHeadshotScatter.innerHTML.trim();
      }
    });
  }
}

async function downloadSvgAsPng(svgEl, filename, scale = 3) {
  if (!svgEl) return;
  const rawViewBox = String(svgEl.getAttribute("viewBox") || "").trim().split(/\s+/).map(Number);
  const width = Number.isFinite(rawViewBox[2]) ? rawViewBox[2] : svgEl.clientWidth || 1200;
  const height = Number.isFinite(rawViewBox[3]) ? rawViewBox[3] : svgEl.clientHeight || 800;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const imageNodes = Array.from(clone.querySelectorAll("image"));
  await Promise.all(imageNodes.map(async (node) => {
    const href = node.getAttribute("href") || node.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "";
    if (!href || href.startsWith("data:")) return;
    try {
      const response = await fetch(href);
      if (!response.ok) throw new Error(`Image fetch failed: ${href}`);
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error(`Image read failed: ${href}`));
        reader.readAsDataURL(blob);
      });
      node.setAttribute("href", dataUrl);
      node.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", dataUrl);
    } catch (error) {
      console.warn("Headshot export inline failed", href, error);
    }
  }));

  const serialized = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to render chart export."));
      image.src = blobUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas export context unavailable.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0, width, height);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function initNbaHeadshotGraph() {
  const nbaHeadshotMeta = document.getElementById("nba-headshot-meta");
  const nbaHeadshotScatter = document.getElementById("nba-headshot-scatter");
  const nbaHeadshotDownload = document.getElementById("nba-headshot-download");
  if (!nbaHeadshotMeta || !nbaHeadshotScatter) return;
  if (nbaHeadshotDownload) nbaHeadshotDownload.disabled = true;
  try {
    const rows = await fetchCsvStrict(NBA_HEADSHOT_TS_PPG_URL);
    nbaHeadshotRows = rows.map((row) => ({
      player_id: String(row.player_id || ""),
      player_name: String(row.player_name || "").trim(),
      gp: toFinite(row.gp, 0),
      ppg: toFinite(row.ppg, 0),
      ts_pct: toFinite(row.ts_pct, 0),
      headshot_path: String(row.headshot_path || "").trim(),
      headshot_available: String(row.headshot_available || "0"),
    })).filter((r) => r.player_id && r.player_name);
    renderNbaHeadshotGraph();
  } catch (error) {
    if (nbaHeadshotMeta) nbaHeadshotMeta.textContent = `Failed to load headshot graph data: ${error.message}`;
    if (nbaHeadshotScatter) nbaHeadshotScatter.innerHTML = "";
    if (nbaHeadshotDownload) nbaHeadshotDownload.disabled = true;
  }
}
