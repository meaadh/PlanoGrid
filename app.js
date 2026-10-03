// ═══════════════════════════════════════════════════
//  CUSTOM DIALOGS
// ═══════════════════════════════════════════════════
function showConfirm(message, danger) {
  return new Promise((resolve) => {
    document.getElementById("confirm-message").textContent = message;
    const okBtn = document.getElementById("confirm-ok-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");
    okBtn.classList.toggle("danger", !!danger);
    cancelBtn.style.display = "";
    const modal = document.getElementById("confirm-modal");
    modal.style.display = "flex";
    function cleanup() {
      modal.style.display = "none";
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
    }
    function onOk() {
      cleanup();
      resolve(true);
    }
    function onCancel() {
      cleanup();
      resolve(false);
    }
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}

function showAlert(message) {
  return new Promise((resolve) => {
    document.getElementById("confirm-message").textContent = message;
    const okBtn = document.getElementById("confirm-ok-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");
    okBtn.classList.remove("danger");
    cancelBtn.style.display = "none";
    const modal = document.getElementById("confirm-modal");
    modal.style.display = "flex";
    function cleanup() {
      modal.style.display = "none";
      okBtn.removeEventListener("click", onOk);
    }
    function onOk() {
      cleanup();
      resolve();
    }
    okBtn.addEventListener("click", onOk);
  });
}

// ═══════════════════════════════════════════════════
//  DEFAULT DATA
// ═══════════════════════════════════════════════════
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "32oz Tall Plastic Bottle",
    size: "32 oz",
    desc: "Tall Plastic Bottle",
    color: "#4A90D9",
  },
  {
    id: 2,
    name: "20oz Plastic Bottle",
    size: "20 oz",
    desc: "Plastic Bottle",
    color: "#5CB85C",
  },
  {
    id: 3,
    name: "7.5oz Can",
    size: "7.5 oz",
    desc: "Mini Can",
    color: "#C0392B",
  },
  {
    id: 4,
    name: "8.4oz Can",
    size: "8.4 oz",
    desc: "Energy Can",
    color: "#08c7c7",
  },
  {
    id: 5,
    name: "12oz Can",
    size: "12 oz",
    desc: "Standard Can",
    color: "#F08913",
  },
  {
    id: 6,
    name: "16oz Can",
    size: "16 oz",
    desc: "Standard Can",
    color: "#9B59B6",
  },
  {
    id: 7,
    name: "20oz Can",
    size: "20 oz",
    desc: "Standard Can",
    color: "#2980B9",
  },
  {
    id: 8,
    name: "24oz Can",
    size: "24 oz",
    desc: "Tall Can",
    color: "#E74C3C",
  },
  {
    id: 9,
    name: "28oz Wide Plastic Bottle",
    size: "28 oz",
    desc: "Wide Plastic Bottle",
    color: "#1ABC9C",
  },
  {
    id: 10,
    name: "2L Plastic Bottle",
    size: "2 L",
    desc: "2 Liter Plastic Bottle",
    color: "#E67E22",
  },
];

const DOOR_COLORS = [
  "#2563eb",
  "#65a30d",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#db2777",
  "#059669",
  "#b45309",
  "#4f46e5",
  "#0d9488",
  "#be123c",
];

const FLAVOR_COLORS = [
  "#558b2f", // olive green
  "#1565c0", // deep blue
  "#2e7d32", // forest green
  "#e65100", // burnt orange
  "#6a1b9a", // deep purple
  "#006064", // dark teal
  "#880e4f", // deep magenta
  "#37474f", // blue-grey
  "#4e342e", // dark brown
  "#0277bd", // steel blue
];

let _flavorColorMap = {};
let _flavorColorCounter = 0;

function resetFlavorColorMap() {
  _flavorColorMap = {};
  _flavorColorCounter = 0;
  for (let s = 0; s < S.shelves; s++)
    for (let d = 0; d < S.doors; d++)
      for (const b of S.flavorGrid[s]?.[d] || [])
        if (b && !_flavorColorMap[b]) {
          _flavorColorMap[b] =
            FLAVOR_COLORS[_flavorColorCounter % FLAVOR_COLORS.length];
          _flavorColorCounter++;
        }
}

function getFlavorColor(flavorName) {
  if (!flavorName) return "#888";
  if (!_flavorColorMap[flavorName]) {
    _flavorColorMap[flavorName] =
      FLAVOR_COLORS[_flavorColorCounter % FLAVOR_COLORS.length];
    _flavorColorCounter++;
  }
  return _flavorColorMap[flavorName];
}

// ═══════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════
let S; // main state
let activePid = 1; // selected product id (null = eraser)
let editingPid = null;

function defaultState() {
  return {
    products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
    meta: { store: "", date: "", by: "", type: "" },
    doors: 8,
    shelves: 8,
    shelfWidths: Array(8).fill(10),
    doorNames: [],
    grid: makeGrid(8, 8, Array(8).fill(10)),
    flavorGrid: makeFlavorGrid(8, 8, Array(8).fill(10)),
    brandRowGrid: makeFlavorGrid(8, 8, Array(8).fill(10)),
  };
}

function makeGrid(shelves, doors, widths) {
  return Array.from({ length: shelves }, (_, s) =>
    Array.from({ length: doors }, () =>
      Array(widths[s] || 10).fill(null),
    ),
  );
}

function makeFlavorGrid(shelves, doors, widths) {
  return Array.from({ length: shelves }, (_, s) =>
    Array.from({ length: doors }, () => Array(widths[s] || 10).fill("")),
  );
}

// ═══════════════════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════════════════
function loadState() {
  try {
    const raw = localStorage.getItem("plano_v1");
    if (raw) S = JSON.parse(raw);
  } catch (e) {}
  if (!S) S = defaultState();
  normalizeState();
}

// Back-compat / sanity pass applied to the global S after it's loaded
// from localStorage OR dropped in wholesale via Import JSON.
function normalizeState() {
  // Back-compat: ensure flavorGrid exists and matches grid dimensions
  if (!S.flavorGrid) {
    S.flavorGrid = makeFlavorGrid(S.shelves, S.doors, S.shelfWidths);
  }
  if (!S.brandRowGrid) {
    S.brandRowGrid = makeFlavorGrid(S.shelves, S.doors, S.shelfWidths);
  }
  if (!S.doorNames) S.doorNames = [];
  // Migrate old non-sequential IDs to new 1-10 sequential IDs (runs once on old saves)
  const needsRemap = S.products.some(
    (p) => p.id === 8 && p.name === "7.5oz Can",
  );
  if (needsRemap) {
    const ID_REMAP = {
      1: 1,
      2: 2,
      8: 3,
      9: 4,
      3: 5,
      4: 6,
      10: 7,
      5: 8,
      6: 9,
      7: 10,
    };
    S.products.forEach((p) => {
      if (ID_REMAP[p.id] != null) p.id = ID_REMAP[p.id];
    });
    for (let s = 0; s < (S.grid?.length || 0); s++)
      for (let d = 0; d < (S.grid[s]?.length || 0); d++)
        for (let sl = 0; sl < (S.grid[s][d]?.length || 0); sl++)
          if (
            S.grid[s][d][sl] !== null &&
            ID_REMAP[S.grid[s][d][sl]] != null
          )
            S.grid[s][d][sl] = ID_REMAP[S.grid[s][d][sl]];
    saveState();
  }
  // Add any products that exist in DEFAULT_PRODUCTS but not in saved state,
  // and sync color/name/size/desc from DEFAULT_PRODUCTS so code-level changes take effect
  DEFAULT_PRODUCTS.forEach((dp) => {
    const existing = S.products.find((p) => p.id === dp.id);
    if (!existing) {
      S.products.push({ ...dp });
    } else {
      existing.color = dp.color;
      existing.name = dp.name;
      existing.size = dp.size;
      existing.desc = dp.desc;
    }
  });
  // Keep products sorted to match DEFAULT_PRODUCTS display order
  const orderMap = Object.fromEntries(
    DEFAULT_PRODUCTS.map((p, i) => [p.id, i]),
  );
  S.products.sort(
    (a, b) => (orderMap[a.id] ?? 999) - (orderMap[b.id] ?? 999),
  );
}

function saveState() {
  try {
    localStorage.setItem("plano_v1", JSON.stringify(S));
  } catch (e) {}
}

async function resetAll() {
  if (!(await showConfirm("Reset everything and start fresh?", true)))
    return;
  localStorage.removeItem("plano_v1");
  S = defaultState();
  syncInputs();
  renderProductTable();
  renderBuilder();
}

// ═══════════════════════════════════════════════════
//  EXPORT / IMPORT JSON
// ═══════════════════════════════════════════════════
function toggleExportMenu(e) {
  e.stopPropagation();
  document.getElementById("export-menu").classList.toggle("open");
}
document.addEventListener("click", () => {
  document.getElementById("export-menu")?.classList.remove("open");
});

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function downloadJSON(filename, dataObj) {
  const blob = new Blob([JSON.stringify(dataObj, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Raw state exactly as persisted to localStorage.
function exportOriginalJSON() {
  document.getElementById("export-menu").classList.remove("open");
  downloadJSON(`planogram-original-${timestamp()}.json`, S);
}

// Flat list of filled slots: { door, shelf, position, product, size }
function exportModifiedJSON() {
  document.getElementById("export-menu").classList.remove("open");
  const out = [];
  for (let s = 0; s < S.shelves; s++) {
    for (let d = 0; d < S.doors; d++) {
      const slots = S.grid[s]?.[d] || [];
      const flavors = S.flavorGrid[s]?.[d] || [];
      const brandRow = S.brandRowGrid[s]?.[d] || [];
      slots.forEach((pid, sl) => {
        if (pid === null) return;
        const p = S.products.find((x) => x.id === pid);
        if (!p) return;
        const brand = (brandRow[sl] || "").trim();
        const flavor = (flavors[sl] || "").trim();
        const label = [brand, flavor].filter(Boolean).join(" ");
        out.push({
          door: d + 1,
          shelf: s + 1,
          position: sl + 1,
          product: label || p.name,
          size: slotLabel(p),
        });
      });
    }
  }
  downloadJSON(`planogram-modified-${timestamp()}.json`, out);
}

async function importJSON(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;

  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch (err) {
    await showAlert("That file isn't valid JSON.");
    return;
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !Array.isArray(parsed.grid) ||
    !Array.isArray(parsed.products)
  ) {
    await showAlert(
      'This doesn\'t look like an Original JSON export. Use the file from "Export JSON → Original JSON" (not the Modified one) to import a planogram.',
    );
    return;
  }

  if (
    !(await showConfirm(
      "Import this planogram? It will replace everything currently on screen.",
      true,
    ))
  )
    return;

  S = parsed;
  if (!S.meta) S.meta = { store: "", date: "", by: "", type: "" };
  if (!S.doors) S.doors = 8;
  if (!S.shelves) S.shelves = 8;
  if (!S.shelfWidths) S.shelfWidths = Array(S.shelves).fill(10);
  if (!S.grid) S.grid = makeGrid(S.shelves, S.doors, S.shelfWidths);
  normalizeState();
  growGrid();
  saveState();
  syncInputs();
  renderProductTable();
  renderBuilder();
  await showAlert("Planogram imported successfully.");
}

// ═══════════════════════════════════════════════════
//  PAGE NAV
// ═══════════════════════════════════════════════════
function showPage(name, tab) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  tab.classList.add("active");
  if (name === "products") renderProductTable();
  if (name === "builder") renderBuilder();
}

// ═══════════════════════════════════════════════════
//  PRODUCTS PAGE
// ═══════════════════════════════════════════════════
function renderProductTable() {
  const tbody = document.getElementById("product-tbody");
  tbody.innerHTML = "";
  S.products.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
<td><strong style="color:#1a3c5e">${p.id}</strong></td>
<td><div class="color-swatch" style="background:${p.color}"></div></td>
<td><strong>${p.name}</strong></td>
<td style="color:#666">${p.size}</td>
<td style="color:#999;font-size:12px">${p.desc}</td>
<td><button class="btn btn-light btn-sm" onclick="openEditModal(${p.id})">Edit</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ═══════════════════════════════════════════════════
//  EDIT MODAL
// ═══════════════════════════════════════════════════
function openEditModal(id) {
  editingPid = id;
  const p = S.products.find((x) => x.id === id);
  document.getElementById("modal-title").textContent = "Edit Product";
  document.getElementById("edit-name").value = p.name;
  document.getElementById("edit-size").value = p.size;
  document.getElementById("edit-desc").value = p.desc;
  document.getElementById("edit-color").value = p.color;
  document.getElementById("edit-modal").style.display = "flex";
}
function openAddModal() {
  editingPid = null;
  document.getElementById("modal-title").textContent = "Add Product Size";
  document.getElementById("edit-name").value = "";
  document.getElementById("edit-size").value = "";
  document.getElementById("edit-desc").value = "";
  document.getElementById("edit-color").value = "#4A90D9";
  document.getElementById("edit-modal").style.display = "flex";
  document.getElementById("edit-name").focus();
}
function onBackdropClick(e) {
  if (e.target.id === "edit-modal") closeModal();
}
function closeModal() {
  document.getElementById("edit-modal").style.display = "none";
  editingPid = null;
}
async function saveProduct() {
  if (editingPid === null) {
    // Add new product
    const name = document.getElementById("edit-name").value.trim();
    const size = document.getElementById("edit-size").value.trim();
    if (!name || !size) {
      await showAlert("Product Name and Size are required.");
      return;
    }
    const nextId =
      S.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    S.products.push({
      id: nextId,
      name,
      size,
      desc: document.getElementById("edit-desc").value.trim(),
      color: document.getElementById("edit-color").value,
    });
  } else {
    const p = S.products.find((x) => x.id === editingPid);
    p.name = document.getElementById("edit-name").value.trim() || p.name;
    p.size = document.getElementById("edit-size").value.trim() || p.size;
    p.desc = document.getElementById("edit-desc").value.trim();
    p.color = document.getElementById("edit-color").value;
  }
  saveState();
  closeModal();
  renderProductTable();
  // Refresh builder visuals if open
  if (
    document.getElementById("page-builder").classList.contains("active")
  ) {
    renderPalette();
    renderPlanogram();
  }
}

// ═══════════════════════════════════════════════════
//  BUILDER — config helpers (more in next batch)
// ═══════════════════════════════════════════════════
function syncInputs() {
  document.getElementById("cfg-store").value = S.meta.store;
  document.getElementById("cfg-type").value = S.meta.type || "";
  document.getElementById("cfg-date").value = S.meta.date;
  document.getElementById("cfg-by").value = S.meta.by;
  document.getElementById("cfg-doors").value = S.doors;
  document.getElementById("cfg-shelves").value = S.shelves;
  document.getElementById("cfg-slots").value = S.shelfWidths[0] || 10;
}

function updateMeta() {
  S.meta.store = document.getElementById("cfg-store").value;
  S.meta.type = document.getElementById("cfg-type").value;
  S.meta.date = document.getElementById("cfg-date").value;
  S.meta.by = document.getElementById("cfg-by").value;
  const s = document.getElementById("meta-store");
  if (s) {
    s.textContent = S.meta.store || "_______________";
    document.getElementById("meta-date").textContent =
      S.meta.date || "___________";
    document.getElementById("meta-by").textContent =
      S.meta.by || "___________";
    const tEl = document.getElementById("plano-type");
    if (tEl) tEl.textContent = S.meta.type || "Cooler";
  }
  saveState();
  generatePrintLayout();
}

// ═══════════════════════════════════════════════════
//  GRID HELPERS
// ═══════════════════════════════════════════════════
function growGrid() {
  const { shelves, doors, shelfWidths, grid } = S;
  if (!S.flavorGrid) S.flavorGrid = [];
  if (!S.brandRowGrid) S.brandRowGrid = [];
  const flavorGrid = S.flavorGrid;
  const brandRowGrid = S.brandRowGrid;

  while (shelfWidths.length < shelves)
    shelfWidths.push(shelfWidths[shelfWidths.length - 1] || 10);

  while (grid.length < shelves) {
    const s = grid.length;
    grid.push(
      Array.from({ length: doors }, () =>
        Array(shelfWidths[s]).fill(null),
      ),
    );
  }
  while (flavorGrid.length < shelves) {
    const s = flavorGrid.length;
    flavorGrid.push(
      Array.from({ length: doors }, () => Array(shelfWidths[s]).fill("")),
    );
  }
  while (brandRowGrid.length < shelves) {
    const s = brandRowGrid.length;
    brandRowGrid.push(
      Array.from({ length: doors }, () => Array(shelfWidths[s]).fill("")),
    );
  }

  for (let s = 0; s < shelves; s++) {
    while (grid[s].length < doors)
      grid[s].push(Array(shelfWidths[s]).fill(null));
    while (flavorGrid[s].length < doors)
      flavorGrid[s].push(Array(shelfWidths[s]).fill(""));
    while (brandRowGrid[s].length < doors)
      brandRowGrid[s].push(Array(shelfWidths[s]).fill(""));
    for (let d = 0; d < doors; d++) {
      const w = shelfWidths[s];
      const cur = grid[s][d];
      while (cur.length < w) cur.push(null);
      if (cur.length > w) cur.length = w;
      const fc = flavorGrid[s][d];
      while (fc.length < w) fc.push("");
      if (fc.length > w) fc.length = w;
      const brc = brandRowGrid[s][d];
      while (brc.length < w) brc.push("");
      if (brc.length > w) brc.length = w;
    }
  }
}

// ═══════════════════════════════════════════════════
//  APPLY CONFIG
// ═══════════════════════════════════════════════════
async function applyConfig() {
  const doors = Math.max(
    1,
    Math.min(20, +document.getElementById("cfg-doors").value || 8),
  );
  const shelves = Math.max(
    1,
    Math.min(20, +document.getElementById("cfg-shelves").value || 8),
  );
  const slots = Math.max(
    1,
    Math.min(30, +document.getElementById("cfg-slots").value || 10),
  );

  S.doors = doors;
  S.shelves = shelves;
  while (S.doorNames.length < doors) S.doorNames.push("");
  // Grow shelfWidths; only reset widths if user confirms
  while (S.shelfWidths.length < shelves) S.shelfWidths.push(slots);
  S.shelfWidths.length = shelves;
  if (await showConfirm("Set ALL shelf widths to " + slots + " slots?")) {
    S.shelfWidths = Array(shelves).fill(slots);
  }
  growGrid();
  S.grid.length = shelves;
  for (let s = 0; s < shelves; s++) S.grid[s].length = doors;
  renderBuilder();
  saveState();
}

// ═══════════════════════════════════════════════════
//  PALETTE
// ═══════════════════════════════════════════════════
function selectProduct(id) {
  activePid = id;
  renderPalette();
}

function renderPalette() {
  const el = document.getElementById("palette");
  el.innerHTML = "";
  S.products.forEach((p) => {
    const div = document.createElement("div");
    div.className =
      "palette-item" + (activePid === p.id ? " active" : "");
    div.onclick = () => selectProduct(p.id);
    div.innerHTML = `
<div class="palette-chip" style="background:${p.color}">${p.id}</div>
<div>
  <div class="palette-name">${p.name}</div>
  <div class="palette-size">${p.size}</div>
</div>`;
    el.appendChild(div);
  });
  const er = document.getElementById("eraser-row");
  er.className = "eraser-row" + (activePid === null ? " active" : "");
}

// ═══════════════════════════════════════════════════
//  SHELF WIDTH CONTROLS
// ═══════════════════════════════════════════════════
function renderShelfWidthControls() {
  const el = document.getElementById("sw-controls");
  el.innerHTML = "";
  for (let s = 0; s < S.shelves; s++) {
    const row = document.createElement("div");
    row.className = "sw-row";
    row.innerHTML = `
<label>Shelf ${s + 1}</label>
<input type="number" min="1" max="30" value="${S.shelfWidths[s] || 10}"
       onchange="setShelfWidth(${s}, this.value)">`;
    el.appendChild(row);
  }
}

function setShelfWidth(shelfIdx, val) {
  const w = Math.max(1, Math.min(30, parseInt(val) || 10));
  S.shelfWidths[shelfIdx] = w;
  for (let d = 0; d < S.doors; d++) {
    const cur = S.grid[shelfIdx][d];
    while (cur.length < w) cur.push(null);
    if (cur.length > w) cur.length = w;
    const fc = S.flavorGrid[shelfIdx][d];
    while (fc.length < w) fc.push("");
    if (fc.length > w) fc.length = w;
    const brc = S.brandRowGrid[shelfIdx][d];
    while (brc.length < w) brc.push("");
    if (brc.length > w) brc.length = w;
  }
  renderPlanogram();
  renderSummary();
  saveState();
}

// ═══════════════════════════════════════════════════
//  SUMMARY
// ═══════════════════════════════════════════════════
function renderSummary() {
  const totalSlots =
    S.shelfWidths.slice(0, S.shelves).reduce((a, b) => a + b, 0) *
    S.doors;
  const counts = {};
  S.products.forEach((p) => (counts[p.id] = 0));
  let filled = 0;
  for (let s = 0; s < S.shelves; s++)
    for (let d = 0; d < S.doors; d++)
      for (const v of S.grid[s]?.[d] || [])
        if (v !== null) {
          filled++;
          counts[v] = (counts[v] || 0) + 1;
        }

  let html = `
    <tr><td>Doors</td><td>${S.doors}</td></tr>
    <tr><td>Shelves / Door</td><td>${S.shelves}</td></tr>
    <tr><td>Total Slots</td><td>${totalSlots}</td></tr>
    <tr><td>Filled</td><td>${filled}</td></tr>
    <tr><td>Empty</td><td>${totalSlots - filled}</td></tr>
    <tr><td style="padding-top:8px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.4px;font-weight:700">By Product Sizes</td><td></td></tr>`;
  S.products.forEach((p) => {
    html += `<tr>
<td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};margin-right:4px;vertical-align:middle"></span>${p.size}</td>
<td>${counts[p.id] || 0}</td>
    </tr>`;
  });
  document.getElementById("sum-table").innerHTML = html;
}

// ═══════════════════════════════════════════════════
//  RENDER BUILDER (orchestrator)
// ═══════════════════════════════════════════════════
function renderBuilder() {
  growGrid();
  renderPalette();
  renderShelfWidthControls();
  renderPlanogram();
  renderSummary();
}

// ═══════════════════════════════════════════════════
//  PAINT MODE
// ═══════════════════════════════════════════════════
let paintMode = "flavor";

function setPaintMode(mode) {
  paintMode = mode;
  document
    .getElementById("brand-label-section")
    ?.classList.toggle("paint-active", mode === "brand");
  document
    .getElementById("flavor-label-section")
    ?.classList.toggle("paint-active", mode === "flavor");
}

function clearBrandLabel() {
  const el = document.getElementById("active-top-brand");
  if (el) {
    el.value = "";
    el.blur();
  }
}

function clearFlavorLabel() {
  const el = document.getElementById("active-flavor");
  if (el) {
    el.value = "";
    el.blur();
  }
}

// ═══════════════════════════════════════════════════
//  BRAND ROW BUILDER
// ═══════════════════════════════════════════════════
function buildBrandRowHeaderHTML(
  slots,
  brandRow,
  products,
  slotW = SLOT_W,
) {
  const runs = [];
  let i = 0;
  while (i < slots.length) {
    const b = brandRow[i] || "";
    let j = i + 1;
    while (j < slots.length && (brandRow[j] || "") === b) j++;
    runs.push({ brand: b, slots: slots.slice(i, j), count: j - i });
    i = j;
  }

  const totalW =
    slots.length * slotW + Math.max(0, slots.length - 1) * SLOT_GAP;
  let html = `<div class="brand-row-header" style="width:${totalW}px">`;
  runs.forEach((r) => {
    const w = r.count * slotW + (r.count - 1) * SLOT_GAP;
    if (r.brand) {
      const pid = r.slots[0];
      const p = pid !== null ? products.find((x) => x.id === pid) : null;
      const bg = p ? p.color : "#888";
      html += `<div class="brand-row-seg" style="width:${w}px;background:${bg}" title="${r.brand}">${r.brand}</div>`;
    } else {
      html += `<div class="brand-row-seg no-brand-row" style="width:${w}px"></div>`;
    }
  });
  html += "</div>";
  return html;
}

// ═══════════════════════════════════════════════════
//  FLAVOR HEADER BUILDER
// ═══════════════════════════════════════════════════
const SLOT_W = 45, // must match CSS .slot width
  PRINT_SLOT_W = 38, // must match @media print .slot width
  SLOT_GAP = 2; // must match CSS .slots-row gap

function buildFlavorHeaderHTML(slots, flavors, s, d, slotW = SLOT_W) {
  const runs = [];
  let i = 0;
  while (i < slots.length) {
    const f = flavors[i] || "";
    const pid = slots[i];
    let j = i + 1;
    while (j < slots.length && (flavors[j] || "") === f) j++;
    runs.push({ flavor: f, pid, count: j - i, start: i });
    i = j;
  }

  const legend = [];
  let legendNum = 0;
  const flavorToNum = {};

  const totalW =
    slots.length * slotW + Math.max(0, slots.length - 1) * SLOT_GAP;
  let html = `<div class="flavor-header" style="width:${totalW}px">`;
  runs.forEach((r) => {
    const w = r.count * slotW + (r.count - 1) * SLOT_GAP;
    if (r.flavor) {
      const bg = getFlavorColor(r.flavor);
      if (r.count < 2) {
        if (!(r.flavor in flavorToNum)) {
          legendNum++;
          flavorToNum[r.flavor] = legendNum;
          legend.push({ num: legendNum, flavor: r.flavor, color: bg });
        }
        html += `<div class="flavor-seg" style="width:${w}px;background:${bg}" title="${r.flavor}">${flavorToNum[r.flavor]}</div>`;
      } else {
        html += `<div class="flavor-seg" style="width:${w}px;background:${bg}" title="${r.flavor}">${r.flavor}</div>`;
      }
    } else {
      html += `<div class="flavor-seg no-flavor" style="width:${w}px"></div>`;
    }
  });
  html += "</div>";
  return { headerHTML: html, legend };
}

function buildCellLegendHTML(legend) {
  if (!legend || legend.length === 0) return "";
  let html = '<div class="cell-legend">';
  legend.forEach((item) => {
    html += `<div class="cell-legend-item">
<span class="cell-legend-num" style="background:${item.color}">${item.num}</span>
<span class="cell-legend-flavor">${item.flavor}</span>
    </div>`;
  });
  return html + "</div>";
}

// ═══════════════════════════════════════════════════
//  PLANOGRAM GRID
// ═══════════════════════════════════════════════════
function slotLabel(p) {
  return p.size.replace(" ", "");
}

function renderPlanogram() {
  resetFlavorColorMap();
  const { doors, shelves, meta, products, shelfWidths, grid } = S;
  const c = document.getElementById("planogram-container");

  // ── Header ──────────────────────────────────────
  let html = `
    <div class="plano-header">
<div class="plano-title">
  <span id="plano-type">${meta.type || "Cooler"}</span> Planogram &mdash; ${doors} Door${doors > 1 ? "s" : ""} | ${shelves} Shel${shelves > 1 ? "ves" : "f"}
</div>
<div class="plano-meta">
  <span>Store:&nbsp;<strong id="meta-store">${meta.store || "_______________"}</strong></span>
  <span>Date:&nbsp;<strong id="meta-date">${meta.date || "___________"}</strong></span>
  <span>Planogram By:&nbsp;<strong id="meta-by">${meta.by || "___________"}</strong></span>
</div>
    </div>`;

  // ── Grid table ───────────────────────────────────
  html += `<table class="plano-table"><thead><tr>`;
  html += `<th class="corner">SHELF</th>`;
  for (let d = 0; d < doors; d++) {
    const col = DOOR_COLORS[d % DOOR_COLORS.length];
    const dName = S.doorNames[d] || `DOOR ${d + 1}`;
    html += `<th class="door-hdr" data-door="${d}" style="background:${col}" onclick="editDoorName(${d},this)" title="Click to rename">${dName}</th>`;
  }
  html += `</tr></thead><tbody>`;

  for (let s = 0; s < shelves; s++) {
    html += `<tr><td class="shelf-num">${s + 1}</td>`;
    for (let d = 0; d < doors; d++) {
      const slots = grid[s]?.[d] || [];
      const flavors = S.flavorGrid[s]?.[d] || [];
      const brandRow = S.brandRowGrid[s]?.[d] || [];
      const { headerHTML: _bh, legend: _bl } = buildFlavorHeaderHTML(
        slots,
        flavors,
        s,
        d,
      );
      html += `<td class="door-cell">`;
      html += buildBrandRowHeaderHTML(slots, brandRow, products);
      html += _bh;
      html += `<div class="slots-row">`;
      slots.forEach((pid, sl) => {
        const p =
          pid !== null ? products.find((x) => x.id === pid) : null;
        const flavor = flavors[sl] || "";
        const titleStr = p
          ? flavor
            ? `${flavor} — ${p.name} (${p.size})`
            : `${p.name} (${p.size})`
          : "Empty";
        html += `<div class="slot ${p ? "" : "empty"}"
                style="${p ? "background:" + p.color : ""}"
                title="${titleStr}"
                data-s="${s}" data-d="${d}" data-sl="${sl}">
             <span class="slot-num">${p ? slotLabel(p) : ""}</span>
           </div>`;
      });
      html += `</div>`;
      html += buildCellLegendHTML(_bl);
      html += `</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  html += `<p style="margin-top:20px;font-size:11px;color:#aaa">
    Select a product in the sidebar to fill slots &mdash; or type a Brand / Flavor label and paint to apply naming.
  </p>`;

  c.innerHTML = html;

  // Attach click + drag + touch listeners after DOM update
  c.querySelectorAll(".slot").forEach((el) => {
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      paintSlot(el);
    });
    el.addEventListener("mouseenter", () => {
      if (isPainting) paintSlot(el);
    });
    el.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        isPainting = true;
        paintSlot(el);
      },
      { passive: false },
    );
  });

  // Touch drag — find slot under finger via elementFromPoint
  c.addEventListener(
    "touchmove",
    (e) => {
      if (!isPainting) return;
      e.preventDefault();
      const t = e.touches[0];
      const target = document.elementFromPoint(t.clientX, t.clientY);
      const slot = target?.closest?.("[data-s]");
      if (slot) paintSlot(slot);
    },
    { passive: false },
  );

  c.addEventListener("touchend", () => {
    isPainting = false;
  });

  generatePrintLayout();
}

// ═══════════════════════════════════════════════════
//  PRINT LAYOUT (paginated: 24 slots wide, 8 shelves tall)
// ═══════════════════════════════════════════════════
function generatePrintLayout() {
  const PRINT_SLOTS_PER_PAGE = 24;
  const PRINT_SHELVES_PER_PAGE = 8;
  const { doors, shelves, meta, products, shelfWidths, grid } = S;

  const maxSlotsPerDoor = Math.max(...shelfWidths.slice(0, shelves));

  const isPortrait1Door = doors === 1;
  let effectiveSlotW = PRINT_SLOT_W;
  if (isPortrait1Door) {
    const PORTRAIT_USABLE_W = 733; // ~194mm at 96dpi minus 16mm margins
    const SHELF_COL_W = 35;
    const maxSlots = Math.max(maxSlotsPerDoor, 1);
    const computed = Math.floor(
      (PORTRAIT_USABLE_W - SHELF_COL_W - Math.max(0, maxSlots - 1) * SLOT_GAP) / maxSlots
    );
    effectiveSlotW = Math.max(PRINT_SLOT_W, Math.min(computed, 120));
  }

  // Group doors so total slots across ≤ PRINT_SLOTS_PER_PAGE
  const doorGroups = [];
  let curGroup = [],
    curSlots = 0;
  for (let d = 0; d < doors; d++) {
    if (
      curSlots > 0 &&
      curSlots + maxSlotsPerDoor > PRINT_SLOTS_PER_PAGE
    ) {
      doorGroups.push(curGroup);
      curGroup = [];
      curSlots = 0;
    }
    curGroup.push(d);
    curSlots += maxSlotsPerDoor;
  }
  if (curGroup.length > 0) doorGroups.push(curGroup);

  // Group shelves into blocks of PRINT_SHELVES_PER_PAGE
  const shelfGroups = [];
  for (let s = 0; s < shelves; s += PRINT_SHELVES_PER_PAGE)
    shelfGroups.push({
      start: s,
      end: Math.min(s + PRINT_SHELVES_PER_PAGE, shelves),
    });

  const totalPages = doorGroups.length * shelfGroups.length;
  let pageIdx = 0,
    html = "";

  for (const sg of shelfGroups) {
    for (const dg of doorGroups) {
      pageIdx++;
      const isLast = pageIdx === totalPages;
      html += `<div class="print-page${isLast ? "" : " page-break"}">`;

      // Page header
      html += `<div class="print-page-header">
  <div class="plano-title">${meta.type || "Cooler"} Planogram &mdash; ${doors} Door${doors !== 1 ? "s" : ""} | ${shelves} Shel${shelves !== 1 ? "ves" : "f"}</div>
  <div class="plano-meta">
    <span>Store:&nbsp;<strong>${meta.store || "_______________"}</strong></span>
    <span>Date:&nbsp;<strong>${meta.date || "___________"}</strong></span>
    <span>Planogram By:&nbsp;<strong>${meta.by || "___________"}</strong></span>
  </div>
</div>`;

      // Product key
      html += `<div class="product-key"><span class="key-label">Key:</span>`;
      products.forEach((p) => {
        html += `<div class="key-item">
          <div class="key-chip" style="background:${p.color}"></div>
          <span>${p.name} (${p.size})</span>
        </div>`;
      });
      html += `</div>`;

      // Grid — single table per logical print page so thead auto-repeats on each physical page
      html += `<table class="plano-table"><thead><tr><th class="corner">SHELF</th>`;
      dg.forEach((d) => {
        const col = DOOR_COLORS[d % DOOR_COLORS.length];
        const dName = S.doorNames[d] || `DOOR ${d + 1}`;
        html += `<th class="door-hdr" style="background:${col}">${dName}</th>`;
      });
      html += `</tr></thead><tbody>`;

      for (let s = sg.start; s < sg.end; s++) {
        html += `<tr><td class="shelf-num">${s + 1}</td>`;
        dg.forEach((d) => {
          const slots = grid[s]?.[d] || [];
          const flavors = S.flavorGrid[s]?.[d] || [];
          const brandRow = S.brandRowGrid[s]?.[d] || [];
          const { headerHTML: _ph, legend: _pl } = buildFlavorHeaderHTML(
            slots,
            flavors,
            s,
            d,
            effectiveSlotW,
          );
          html += `<td class="door-cell">`;
          html += buildBrandRowHeaderHTML(
            slots,
            brandRow,
            products,
            effectiveSlotW,
          );
          html += _ph;
          html += `<div class="slots-row">`;
          slots.forEach((pid) => {
            const p =
              pid !== null ? products.find((x) => x.id === pid) : null;
            html += `<div class="slot${p ? "" : " empty"}" style="${p ? "background:" + p.color : ""}">
        <span class="slot-num">${p ? slotLabel(p) : ""}</span>
      </div>`;
          });
          html += `</div>`;
          html += buildCellLegendHTML(_pl);
          html += `</td>`;
        });
        html += `</tr>`;
      }

      html += `</tbody></table></div>`;
    }
  }

  const el = document.getElementById("print-planogram");
  if (el) {
    el.innerHTML = html;
    el.dataset.slotW = effectiveSlotW;
    if (isPortrait1Door) {
      el.classList.add("portrait-1door");
    } else {
      el.classList.remove("portrait-1door");
    }
  }
}

// ═══════════════════════════════════════════════════
//  BRAND HISTORY QUICK-SELECT
// ═══════════════════════════════════════════════════
const flavorHistory = new Set();

function getActiveFlavor() {
  return (document.getElementById("active-flavor")?.value || "").trim();
}

function pickFlavor(name) {
  const input = document.getElementById("active-flavor");
  if (input) input.value = name;
}

function addToFlavorHistory(name) {
  if (!name) return;
  flavorHistory.add(name);
  const el = document.getElementById("flavor-history");
  if (!el) return;
  el.innerHTML = "";
  flavorHistory.forEach((b) => {
    const pill = document.createElement("div");
    pill.style.cssText =
      "cursor:pointer;background:#e8f0fe;border:1px solid #c5d8ff;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700;color:#1a3c5e";
    pill.textContent = b;
    pill.onclick = () => pickFlavor(b);
    el.appendChild(pill);
  });
}

// ── Top Brand History ────────────────────────────────
const topBrandHistory = new Set();

function addToTopBrandHistory(name) {
  if (!name) return;
  topBrandHistory.add(name);
  const el = document.getElementById("top-brand-history");
  if (!el) return;
  el.innerHTML = "";
  topBrandHistory.forEach((b) => {
    const pill = document.createElement("div");
    pill.style.cssText =
      "cursor:pointer;background:#fde8c8;border:1px solid #f5b97f;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700;color:#7a3800";
    pill.textContent = b;
    pill.onclick = () => {
      document.getElementById("active-top-brand").value = b;
      setPaintMode("brand");
    };
    el.appendChild(pill);
  });
}

// ═══════════════════════════════════════════════════
//  SLOT PAINTING
// ═══════════════════════════════════════════════════
let isPainting = false;
document.addEventListener("mousedown", () => {
  isPainting = true;
});
document.addEventListener("mouseup", () => {
  isPainting = false;
});
document.addEventListener("touchend", () => {
  isPainting = false;
});

function paintSlot(el) {
  const s = +el.dataset.s;
  const d = +el.dataset.d;
  const sl = +el.dataset.sl;

  if (paintMode === "brand") {
    const brandName = (
      document.getElementById("active-top-brand")?.value || ""
    ).trim();
    if (!S.brandRowGrid[s]) S.brandRowGrid[s] = [];
    if (!S.brandRowGrid[s][d]) S.brandRowGrid[s][d] = [];
    S.brandRowGrid[s][d][sl] = brandName;
    if (brandName) addToTopBrandHistory(brandName);
    const cell = el.closest(".door-cell");
    if (cell) refreshBrandRowHeader(cell, s, d);
    saveState();
    generatePrintLayout();
    return;
  }

  const flavor = getActiveFlavor();
  S.grid[s][d][sl] = activePid;
  if (!S.flavorGrid[s]) S.flavorGrid[s] = [];
  if (!S.flavorGrid[s][d]) S.flavorGrid[s][d] = [];
  S.flavorGrid[s][d][sl] = activePid !== null ? flavor : "";

  const p =
    activePid !== null
      ? S.products.find((x) => x.id === activePid)
      : null;
  if (p) {
    el.className = "slot";
    el.style.background = p.color;
    const title = flavor
      ? `${flavor} — ${p.name} (${p.size})`
      : `${p.name} (${p.size})`;
    el.title = title;
    el.querySelector(".slot-num").textContent = slotLabel(p);
  } else {
    el.className = "slot empty";
    el.style.background = "";
    el.title = "Empty";
    el.querySelector(".slot-num").textContent = "";
  }

  if (flavor && activePid !== null) addToFlavorHistory(flavor);

  const cell = el.closest(".door-cell");
  if (cell) refreshFlavorHeader(cell, s, d);
  if (cell) refreshBrandRowHeader(cell, s, d);

  renderSummary();
  saveState();
  generatePrintLayout();
}

function refreshFlavorHeader(cell, s, d) {
  const old = cell.querySelector(".flavor-header");
  if (!old) return;
  const slots = S.grid[s]?.[d] || [];
  const flavors = S.flavorGrid[s]?.[d] || [];
  const { headerHTML, legend } = buildFlavorHeaderHTML(
    slots,
    flavors,
    s,
    d,
  );
  old.outerHTML = headerHTML;
  const legendEl = cell.querySelector(".cell-legend");
  const legendHTML = buildCellLegendHTML(legend);
  if (legendHTML) {
    if (legendEl) legendEl.outerHTML = legendHTML;
    else
      cell
        .querySelector(".slots-row")
        ?.insertAdjacentHTML("afterend", legendHTML);
  } else if (legendEl) {
    legendEl.remove();
  }
}

function refreshBrandRowHeader(cell, s, d) {
  const old = cell.querySelector(".brand-row-header");
  if (!old) return;
  const slots = S.grid[s]?.[d] || [];
  const brandRow = S.brandRowGrid[s]?.[d] || [];
  old.outerHTML = buildBrandRowHeaderHTML(slots, brandRow, S.products);
}

// ═══════════════════════════════════════════════════
//  DOOR NAME EDITING
// ═══════════════════════════════════════════════════
function editDoorName(d, th) {
  const current = S.doorNames[d] || `DOOR ${d + 1}`;
  th.removeAttribute("onclick");

  const input = document.createElement("input");
  input.className = "door-name-input";
  input.value = current;
  th.textContent = "";
  th.appendChild(input);
  input.focus();
  input.select();

  const save = () => {
    const val = input.value.trim() || `DOOR ${d + 1}`;
    S.doorNames[d] = val;
    saveState();
    generatePrintLayout();
    th.textContent = val;
    th.setAttribute("onclick", `editDoorName(${d},this)`);
  };

  input.addEventListener("blur", save);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      input.value = current;
      input.blur();
    }
  });
  input.addEventListener("click", (e) => e.stopPropagation());
}

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
loadState();
syncInputs();
renderProductTable();
renderBuilder(); // so print works even before switching tabs
setPaintMode("flavor");

// Touch-only: tap anywhere on the section to activate that paint mode
// (excludes the clear button and the input itself so those still work normally)
document.getElementById("brand-label-section").addEventListener(
  "touchstart",
  (e) => {
    if (e.target.closest(".clear-label-btn") || e.target.closest("input"))
      return;
    setPaintMode("brand");
  },
  { passive: true },
);

document.getElementById("flavor-label-section").addEventListener(
  "touchstart",
  (e) => {
    if (e.target.closest(".clear-label-btn") || e.target.closest("input"))
      return;
    setPaintMode("flavor");
  },
  { passive: true },
);

// Portrait orientation + full-page fill for 1-door planograms
window.addEventListener("beforeprint", function () {
  const el = document.getElementById("print-planogram");
  if (!el || !el.classList.contains("portrait-1door")) return;
  const slotW = parseInt(el.dataset.slotW) || PRINT_SLOT_W;
  const slotH = Math.round(slotW * 0.74);
  const fs = Math.max(9, Math.min(12, Math.round(slotW * 0.2)));
  const style = document.createElement("style");
  style.id = "portrait-1door-print-style";
  style.textContent = [
    "@page { size: portrait; margin: 8mm; }",
    `.portrait-1door .slot { width: ${slotW}px !important; height: ${slotH}px !important; }`,
    `.portrait-1door .brand-row-seg { max-height: ${slotH}px !important; font-size: ${fs}px !important; }`,
    `.portrait-1door .flavor-seg { max-height: ${slotH}px !important; font-size: ${fs}px !important; }`,
    `.portrait-1door .slot-num { font-size: ${fs + 1}px !important; }`,
  ].join("\n");
  document.head.appendChild(style);
});

window.addEventListener("afterprint", function () {
  const s = document.getElementById("portrait-1door-print-style");
  if (s) s.remove();
});
