import { useState, useRef, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const CLIENT_COLORS = ["#FF6B6B","#FF8E53","#FFC857","#A8E6CF","#7EC8E3","#B388FF","#F48FB1","#80DEEA"];
const DAY_START = 7 * 60;
const DAY_END   = 20 * 60;
const TOTAL_MINS = DAY_END - DAY_START;

// ─── Color helpers ────────────────────────────────────────────────────────────
const colorCache = {};
let colorIdx = 0;
function clientColor(name) {
  if (!name) return "#2a2a3a";
  if (!colorCache[name]) colorCache[name] = CLIENT_COLORS[colorIdx++ % CLIENT_COLORS.length];
  return colorCache[name];
}

// ─── Time helpers ─────────────────────────────────────────────────────────────
const toMins = (t) => { const d = new Date(t); return d.getHours() * 60 + d.getMinutes(); };
const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDur  = (s, e) => {
  const m = Math.round((new Date(e) - new Date(s)) / 60000);
  const h = Math.floor(m / 60), r = m % 60;
  return h > 0 ? `${h}h${r > 0 ? ` ${r}m` : ""}` : `${r}m`;
};
const localDatetime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const todayPrefix = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};

// ─── Lane layout ──────────────────────────────────────────────────────────────
function assignLanes(entries) {
  const sorted = [...entries].sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
  const laneEnds = [];
  return sorted.map(e => {
    const start = new Date(e.startTime), end = new Date(e.endTime);
    let lane = laneEnds.findIndex(le => le <= start);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(end); }
    else laneEnds[lane] = end;
    return { ...e, lane };
  });
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; height: 4px; background: #0c0c14; }
  ::-webkit-scrollbar-thumb { background: #333355; border-radius: 2px; }

  .entry-block {
    cursor: pointer; border-radius: 4px; position: absolute;
    transition: filter .15s, transform .15s;
    border: 1px solid rgba(255,255,255,.08); overflow: hidden;
  }
  .entry-block:hover { filter: brightness(1.25); transform: scaleY(1.04); z-index: 10 !important; }
  .entry-block.sel { outline: 2px solid #fff; outline-offset: 1px; z-index: 20 !important; }

  .hour-tick { position: absolute; top: 0; bottom: 0; border-left: 1px solid rgba(255,255,255,.06); pointer-events: none; }
  .hour-label { position: absolute; top: -22px; transform: translateX(-50%); font-size: 10px; color: #555577; letter-spacing: .05em; }

  .now-line { position: absolute; top: 0; bottom: 0; width: 2px; background: #FF6B6B; z-index: 30; pointer-events: none; }
  .now-line::before { content: 'NOW'; position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 9px; color: #FF6B6B; letter-spacing: .1em; }

  .stat-pill { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 4px 14px; font-size: 11px; color: #8888aa; }
  .stat-pill span { color: #e0e0f0; font-weight: 500; margin-left: 6px; }
  .tag { display: inline-block; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 3px; padding: 2px 8px; font-size: 10px; color: #9999bb; letter-spacing: .05em; margin: 2px; }
  .progress-bar { height: 6px; background: rgba(255,255,255,.07); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; transition: width .6s ease; }
  .detail-row { display: flex; gap: 8px; align-items: baseline; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.04); padding-bottom: 10px; }
  .detail-label { font-size: 9px; color: #555577; letter-spacing: .1em; text-transform: uppercase; width: 80px; flex-shrink: 0; }
  .detail-value { font-size: 12px; color: #c0c0d8; word-break: break-all; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }

  .btn { background: transparent; border: 1px solid rgba(255,255,255,.15); color: #aaaacc; cursor: pointer; border-radius: 4px; padding: 6px 16px; font-family: inherit; font-size: 11px; letter-spacing: .08em; transition: all .15s; }
  .btn:hover:not(:disabled) { background: rgba(255,255,255,.07); color: #e0e0f0; border-color: rgba(255,255,255,.3); }
  .btn:disabled { opacity: .4; cursor: not-allowed; }
  .btn-primary { background: #7EC8E3; color: #0c0c14; border-color: #7EC8E3; font-weight: 500; }
  .btn-primary:hover:not(:disabled) { background: #a4d9ee; border-color: #a4d9ee; color: #0c0c14; }
  .btn-danger { color: #FF6B6B !important; border-color: rgba(255,107,107,.3) !important; }
  .btn-danger:hover:not(:disabled) { background: rgba(255,107,107,.1) !important; }

  .input { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 4px; color: #e0e0f0; font-family: inherit; font-size: 12px; padding: 8px 12px; width: 100%; outline: none; transition: border-color .15s; }
  .input:focus { border-color: #7EC8E3; }
  .input-label { font-size: 10px; color: #555577; letter-spacing: .1em; text-transform: uppercase; display: block; margin-bottom: 6px; }
  .field-group { margin-bottom: 16px; }
  .check-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #8888aa; cursor: pointer; }
  .check-row input { accent-color: #7EC8E3; }

  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.75); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
  .modal { background: #13131f; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 28px; width: 480px; max-height: 92vh; overflow-y: auto; }

  .toast { position: fixed; bottom: 28px; right: 28px; z-index: 200; background: #13131f; border: 1px solid rgba(255,255,255,.1); border-radius: 6px; padding: 12px 20px; font-size: 12px; color: #c0c0d8; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 24px rgba(0,0,0,.5); animation: slideUp .2s ease; }
  .toast.err { border-color: rgba(255,107,107,.4); color: #FF6B6B; }
  .toast.ok  { border-color: rgba(126,200,227,.3); color: #7EC8E3; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  .entry-row { display: grid; grid-template-columns: 12px 1fr auto auto auto; gap: 16px; padding: 10px 14px; border-radius: 4px; cursor: pointer; border: 1px solid transparent; transition: all .15s; align-items: center; }
  .entry-row:hover { background: rgba(255,255,255,.03); }
  .entry-row.sel { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.1); }

  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0c0c14; }
  .login-card { background: #13131f; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; padding: 44px 40px; width: 440px; }
  .login-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #e0e0f0; letter-spacing: -.02em; margin-bottom: 6px; }
  .login-sub { font-size: 11px; color: #555577; letter-spacing: .1em; margin-bottom: 36px; }
  .err-box { background: rgba(255,107,107,.08); border: 1px solid rgba(255,107,107,.25); border-radius: 4px; color: #FF6B6B; font-size: 11px; padding: 10px 14px; margin-bottom: 16px; line-height: 1.5; }

  .nav-date button { background: none; border: none; color: #555577; cursor: pointer; font-size: 16px; padding: 4px 8px; border-radius: 4px; transition: color .15s; font-family: inherit; }
  .nav-date button:hover { color: #e0e0f0; }

  .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.1); border-top-color: #7EC8E3; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; vertical-align: middle; }
  @keyframes spin { to { transform: rotate(360deg); } }

  select.input option { background: #13131f; color: #e0e0f0; }
  input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
`;

// ─── API client ───────────────────────────────────────────────────────────────
function makeApi(baseUrl, token) {
  const base = baseUrl.replace(/\/$/, "");
  const getHeaders = () => {
    const h = new Headers();
    h.append("Content-Type", "application/json");
    h.append("Authorization", `Bearer ${token}`);
    return h;
  };
  const req = async (method, path, body) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${t ? ": " + t : ""}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return null;
  };
  return {
    getEmployee:      (id)            => req("GET",    `/api/Employees/${id}`),
    getEmployees:     ()              => req("GET",    `/api/Employees`),
    getTimesheet:     (empId, date, create) =>
      req("GET", `/api/Timesheets?employeeId=${empId}&referenceDate=${encodeURIComponent(date)}&includeEntries=true&createTimesheet=${create}`),
    submitTimesheet:  (id, val)       => req("PUT",    `/api/Timesheets/${id}/submit`, val),
    addEntry:         (entry)         => req("POST",   `/api/Entries`, entry),
    updateEntry:      (entry)         => req("PUT",    `/api/Entries`, entry),
    deleteEntry:      (id)            => req("DELETE", `/api/Entries/${id}`),
    getClients:       ()              => req("GET",    `/api/Clients`),
    getProjects:      ()              => req("GET",    `/api/Projects`),
    getItems:         ()              => req("GET",    `/api/Items`),
    getLocations:     (empId)         => req("GET",    `/api/Locations?employeeId=${empId}`),
    getFavourites:   (empId)         => req("GET",    `/api/Entries/favourite/${empId}`),
    addFavourite:    (fav)           => req("POST",   `/api/Entries/favourite`, fav),
    updateFavourite: (fav)           => req("PUT",    `/api/Entries/favourite`, fav),
    deleteFavourite: (id)            => req("DELETE", `/api/Entries/favourite/${id}`),
    getLeaveTypes:   ()              => req("GET",    `/api/Leaves`),
    getLeaves:      (empId)         => req("GET",    `/api/Leaves/${empId}`),
    addLeave:       (empId, leave) => req("POST",   `/api/Leaves/${empId}`, leave),
    deleteLeave:     (id)            => req("DELETE", `/api/Leaves/${id}`),
  };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, []);
  return <div className={`toast ${type}`}><span>{type === "ok" ? "✓" : "✕"}</span>{msg}</div>;
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [url,     setUrl]     = useState("/api");
  const [token,   setToken]   = useState("");
  const [empId,   setEmpId]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function sanitizeError(msg) {
    if (!msg) return "Connection failed. Check your URL and token.";
    return msg.replace(/[^\x20-\x7E]/g, "");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const api = makeApi(url.trim(), token.trim());
      let employee;
      if (empId.trim()) {
        employee = await api.getEmployee(parseInt(empId.trim()));
      } else {
        const list = await api.getEmployees();
        if (!list || list.length === 0) throw new Error("No employees found. Please specify an Employee ID.");
        employee = list[0];
      }
      onLogin({ api, employee, baseUrl: url.trim(), token: token.trim() });
    } catch (err) {
      setError(sanitizeError(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">Timesheet</div>
        <div className="login-sub">CONNECT TO YOUR SERVER</div>
        {error && <div className="err-box">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="field-group">
            <label className="input-label">Server URL</label>
            <input className="input" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://your-api.azurewebsites.net" required />
          </div>
          <div className="field-group">
            <label className="input-label">Bearer Token</label>
            <input className="input" type="password" value={token} onChange={e => setToken(e.target.value)}
              placeholder="Paste your JWT token here" required />
          </div>
          <div className="field-group">
            <label className="input-label">
              Employee ID&nbsp;
              <span style={{ color: "#444466", textTransform: "none", letterSpacing: 0 }}>
                (optional — defaults to first employee)
              </span>
            </label>
            <input className="input" value={empId} onChange={e => setEmpId(e.target.value)} placeholder="e.g. 42" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px", marginTop: 4, fontSize: 12, letterSpacing: ".12em" }}>
            {loading
              ? <><span className="spinner" style={{ marginRight: 8 }} />CONNECTING…</>
              : "CONNECT →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Entry Modal ──────────────────────────────────────────────────────────────
function EntryModal({ entry, timesheetId, refDate, api, clients, projects, items, locations, favourites, session, onSave, onSaveFavourite, onDeleteFavourite, onClose }) {
  const editing = !!entry?.id;
  const dateStr = todayPrefix(refDate);

  const [form, setForm] = useState({
    description:  entry?.description   || "",
    taskIssue:    entry?.taskIssue     || "",
    comment:      entry?.comment       || "",
    billable:     entry?.billable      ?? true,
    breakTime:    entry?.breakTime     ?? false,
    startTime:    entry ? localDatetime(entry.startTime) : `${dateStr}T09:00`,
    endTime:      entry ? localDatetime(entry.endTime)   : `${dateStr}T10:00`,
    clientId:     entry?.clientId      ?? "",
    projectId:    entry?.projectId     ?? "",
    itemId:       entry?.itemId        ?? "",
    locationId:   entry?.locationId    ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [favName, setFavName] = useState("");

  const set = (k, v) => setForm(f => ({ 
    ...f, 
    [k]: v,
    // Reset dependent fields when parent changes
    ...(k === 'clientId' && { projectId: '', itemId: '' }),
    ...(k === 'projectId' && { itemId: '' })
  }));

  const filteredProjects = form.clientId
    ? projects.filter(p => {
        const client = clients.find(c => c.id === parseInt(form.clientId));
        return client && p.clientName === client.name && !p.archived;
      })
    : projects.filter(p => !p.archived);

  const filteredItems = form.projectId
    ? items.filter(i => {
        const project = projects.find(p => p.id === parseInt(form.projectId));
        return project && i.projectName === project.name && !i.archived;
      })
    : items.filter(i => !i.archived);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.description.trim()) { setError("Description is required."); return; }
    if (new Date(form.startTime) >= new Date(form.endTime)) { setError("End time must be after start time."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...(editing ? { id: entry.id } : {}),
        description:     form.description.trim(),
        taskIssue:       form.taskIssue || null,
        comment:         form.comment   || null,
        adminComment:    null,
        billable:        form.billable,
        breakTime:       form.breakTime,
        startTime:       new Date(form.startTime).toISOString(),
        endTime:         new Date(form.endTime).toISOString(),
        duration:        "00:00:00",
        unallocatedTime: false,
        clientId:        form.clientId   ? parseInt(form.clientId)   : null,
        projectId:       form.projectId  ? parseInt(form.projectId)  : null,
        itemId:          form.itemId     ? parseInt(form.itemId)     : null,
        locationId:      form.locationId ? parseInt(form.locationId) : null,
        timesheetId,
      };
      if (editing) await api.updateEntry(payload);
      else         await api.addEntry(payload);
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 24, color: "#e0e0f0" }}>
          {editing ? "Edit Entry" : "New Entry"}
        </div>
        {error && <div className="err-box" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSave}>
          {favourites.length > 0 && (
            <div className="field-group">
              <label className="input-label">Quick Add from Favourite</label>
              <select className="input" value="" onChange={e => {
                const fav = favourites.find(f => f.id === parseInt(e.target.value));
                if (fav) {
                  setForm(f => ({
                    ...f,
                    description: fav.description || "",
                    taskIssue: fav.taskIssue || "",
                    billable: fav.billable ?? true,
                    clientId: fav.clientId ? String(fav.clientId) : "",
                    projectId: fav.projectId ? String(fav.projectId) : "",
                    itemId: fav.itemId ? String(fav.itemId) : "",
                    locationId: fav.locationId ? String(fav.locationId) : "",
                  }));
                }
              }}>
                <option value="">— Select a favourite —</option>
                {favourites.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div className="field-group">
            <label className="input-label">Description *</label>
            <input className="input" value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="What did you work on?" autoFocus required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <label className="input-label">Start *</label>
              <input className="input" type="datetime-local" value={form.startTime} onChange={e => set("startTime", e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="input-label">End *</label>
              <input className="input" type="datetime-local" value={form.endTime} onChange={e => set("endTime", e.target.value)} required />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <label className="input-label">Client</label>
              <select className="input" value={form.clientId} onChange={e => set("clientId", e.target.value)}>
                <option value="">— None —</option>
                {clients.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="input-label">Project</label>
              <select className="input" value={form.projectId} onChange={e => set("projectId", e.target.value)}>
                <option value="">— None —</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <label className="input-label">Item</label>
              <select className="input" value={form.itemId} onChange={e => set("itemId", e.target.value)}>
                <option value="">— None —</option>
                {filteredItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="input-label">Location</label>
              <select className="input" value={form.locationId} onChange={e => set("locationId", e.target.value)}>
                <option value="">— None —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field-group">
            <label className="input-label">Task / Issue</label>
            <input className="input" value={form.taskIssue} onChange={e => set("taskIssue", e.target.value)} placeholder="e.g. DEV-1234" />
          </div>
          <div className="field-group">
            <label className="input-label">Comment</label>
            <input className="input" value={form.comment} onChange={e => set("comment", e.target.value)} placeholder="Optional note…" />
          </div>
          <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
            <label className="check-row">
              <input type="checkbox" checked={form.billable} onChange={e => set("billable", e.target.checked)} /> Billable
            </label>
            <label className="check-row">
              <input type="checkbox" checked={form.breakTime} onChange={e => set("breakTime", e.target.checked)} /> Break Time
            </label>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 16, marginTop: 16 }}>
            <div style={{ fontSize: 10, color: "#555577", letterSpacing: ".1em", marginBottom: 8, textTransform: "uppercase" }}>
              Favourite Settings
            </div>
            <div className="field-group">
              <input className="input" value={favName} onChange={e => setFavName(e.target.value)} placeholder="e.g. Daily Standup" />
            </div>
            <button type="button" className="btn" onClick={async () => {
              if (!favName.trim()) return;
              const client = clients.find(c => c.id === parseInt(form.clientId));
              const project = projects.find(p => p.id === parseInt(form.projectId));
              const item = items.find(i => i.id === parseInt(form.itemId));
              const location = locations.find(l => l.id === parseInt(form.locationId));
              await onSaveFavourite({
                name: favName.trim(),
                description: form.description,
                taskIssue: form.taskIssue || null,
                billable: form.billable,
                clientId: form.clientId ? parseInt(form.clientId) : null,
                clientName: client?.name || null,
                projectId: form.projectId ? parseInt(form.projectId) : null,
                projectName: project?.name || null,
                itemId: form.itemId ? parseInt(form.itemId) : null,
                itemName: item?.name || null,
                locationId: form.locationId ? parseInt(form.locationId) : null,
                locationName: location?.name || null,
              });
              setFavName("");
            }}>SAVE AS FAVOURITE</button>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>CANCEL</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ marginRight: 8 }} />SAVING…</> : "SAVE ENTRY"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Leave Modal ────────────────────────────────────────────────────────────────
function LeaveModal({ leaveTypes, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  
  const [form, setForm] = useState({
    leaveType: leaveTypes[0]?.type || "",
    description: "",
    startDate: today,
    endDate: today,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.leaveType) { setError("Please select a leave type."); return; }
    if (new Date(form.startDate) > new Date(form.endDate)) { setError("End date must be after start date."); return; }
    setSaving(true); setError("");
    try {
      await onSave({
        type: form.leaveType,
        description: form.description || null,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 24, color: "#e0e0f0" }}>
          Add Leave
        </div>
        {error && <div className="err-box" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSave}>
          <div className="field-group">
            <label className="input-label">Leave Type *</label>
            <select className="input" value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}>
              <option value="">Select leave type</option>
              {leaveTypes.map(t => <option key={t.id} value={t.type}>{t.type}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="input-label">Description</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional note..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-group">
              <label className="input-label">Start Date *</label>
              <input className="input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div className="field-group">
              <label className="input-label">End Date *</label>
              <input className="input" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>CANCEL</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ marginRight: 8 }} />SAVING…</> : "ADD LEAVE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session,    setSession]    = useState(null);
  const [timesheet,  setTimesheet]  = useState(null);
  const [refDate,    setRefDate]    = useState(new Date());
  const [viewMode,   setViewMode]   = useState('day');
  const [selected,   setSelected]   = useState(null);
  const [hovered,    setHovered]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [loadErr,    setLoadErr]    = useState("");
  const [toast,      setToast]      = useState(null);
  const [modal,      setModal]      = useState(null); // null | "add" | EntryDTO
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clients,    setClients]    = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [items,      setItems]      = useState([]);
  const [locations,  setLocations]  = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [leaveEntries, setLeaveEntries] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const showToast = (msg, type = "ok") => setToast({ msg, type });

  // Load lookup data once after login
  useEffect(() => {
    if (!session) return;
    const { api, employee } = session;
    Promise.all([
      api.getClients().catch(() => []),
      api.getProjects().catch(() => []),
      api.getItems().catch(() => []),
      api.getLocations(employee.id).catch(() => []),
      api.getFavourites(employee.id).catch(() => []),
      api.getLeaves(employee.id).catch(() => []),
      api.getLeaveTypes().catch(() => []),
    ]).then(([c, p, i, l, fav, leaves, types]) => {
      setClients(c || []); setProjects(p || []); setItems(i || []); setLocations(l || []); 
      setFavourites(fav || []); setLeaveEntries(leaves || []); setLeaveTypes(types || []);
    });
  }, [session]);

  // Load timesheet on session or date change
  const loadTimesheet = useCallback(async () => {
    if (!session) return;
    setLoading(true); setLoadErr(""); setSelected(null);
    try {
      const localIso = new Date(refDate.getTime() - refDate.getTimezoneOffset() * 60000).toISOString();
      const ts = await session.api.getTimesheet(session.employee.id, localIso, true);
      setTimesheet(ts);
    } catch (err) {
      setLoadErr(err.message);
      setTimesheet(null);
    } finally {
      setLoading(false);
    }
  }, [session, refDate]);

  useEffect(() => { loadTimesheet(); }, [loadTimesheet]);

  // Date nav
  const shiftDate = (days) => setRefDate(d => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });
  const fmtDate = (d) => d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Submit
  async function handleSubmit() {
    if (!timesheet) return;
    setSubmitting(true);
    try {
      await session.api.submitTimesheet(timesheet.id, !timesheet.submitted);
      showToast(timesheet.submitted ? "Timesheet unsubmitted." : "Timesheet submitted successfully!", "ok");
      await loadTimesheet();
    } catch (err) {
      showToast(err.message, "err");
    } finally {
      setSubmitting(false);
    }
  }

  // Delete
  async function handleDelete(entryId) {
    setDeletingId(entryId);
    try {
      await session.api.deleteEntry(entryId);
      showToast("Entry deleted.", "ok");
      setSelected(null);
      await loadTimesheet();
    } catch (err) {
      showToast(err.message, "err");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Not logged in ──
  if (!session) return (
    <>
      <style>{CSS}</style>
      <LoginScreen onLogin={setSession} />
    </>
  );

  // ── Layout ──
  const entries  = timesheet?.entries || [];
  
  // Get week days from timesheet
  const getWeekDays = () => {
    if (timesheet?.startDate) {
      const start = new Date(timesheet.startDate);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
      });
    }
    const start = new Date(refDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };
  const weekDays = getWeekDays();
  
  const getEntriesForDate = (date) => {
    const dateStr = todayPrefix(date);
    return entries.filter(e => e.startTime?.startsWith(dateStr));
  };
  
  const selectedDateStr = todayPrefix(refDate);
  const dayEntries = getEntriesForDate(refDate);
  const laned    = assignLanes(dayEntries);
  const maxLanes = laned.length ? Math.max(...laned.map(e => e.lane)) + 1 : 1;
  const sel      = selected != null ? laned.find(e => e.id === selected) : null;

  const hours  = Array.from({ length: 14 }, (_, i) => i + 7);
  const nowMin = toMins(new Date());
  const showNow = nowMin >= DAY_START && nowMin <= DAY_END;

  function blockStyle(e) {
    const s  = Math.max(toMins(e.startTime), DAY_START);
    const en = Math.min(toMins(e.endTime),   DAY_END);
    const lh = 100 / maxLanes;
    return {
      left:       `${((s  - DAY_START) / TOTAL_MINS) * 100}%`,
      width:      `${((en - s)         / TOTAL_MINS) * 100}%`,
      top:        `${e.lane * lh}%`,
      height:     `${lh - 1}%`,
      background: e.breakTime ? "#1c1c2a" : clientColor(e.clientName),
      zIndex:     hovered === e.id ? 10 : selected === e.id ? 20 : 1,
    };
  }

  const pct    = timesheet ? Math.min((timesheet.percentageWorked ?? 0) * 100, 100) : 0;
  const pctClr = pct >= 100 ? "#A8E6CF" : pct >= 75 ? "#7EC8E3" : "#FFC857";
  const uniqueClients = [...new Set(entries.filter(e => !e.breakTime && e.clientName).map(e => e.clientName))];
  const sortedEntries = [...laned].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const statusLabel = timesheet?.approved ? "APPROVED" : timesheet?.submitted ? "SUBMITTED" : "DRAFT";
  const statusColor = timesheet?.approved ? "#A8E6CF"  : timesheet?.submitted ? "#7EC8E3"   : "#444466";

  return (
    <>
      <style>{CSS}</style>
      <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0c0c14", minHeight: "100vh", color: "#e0e0f0" }}>

        {/* ── Header ── */}
        <div style={{ padding: "24px 40px 18px", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".2em", color: "#555577", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
              <span>Timesheet</span>
              {timesheet && <span style={{ color: statusColor }}>· {statusLabel}</span>}
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
              {session.employee.name}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {timesheet && <>
              <div className="stat-pill">Expected<span>{timesheet.expectedHours}h</span></div>
              <div className="stat-pill">Logged<span>{(timesheet.totalHours ?? 0).toFixed(2)}h</span></div>
              <div className="stat-pill">Coverage<span>{(timesheet.percentageWorked ?? 0).toFixed(0)}%</span></div>
            </>}
            <button className="btn btn-primary" onClick={() => setModal("add")} style={{ marginLeft: 8 }}>+ ADD ENTRY</button>
            <button className="btn" onClick={() => setModal("addLeave")} style={{ marginLeft: 4 }}>+ ADD LEAVE</button>
            {timesheet && (
              <button className="btn" onClick={handleSubmit} disabled={submitting || timesheet.approved}
                style={timesheet.submitted ? { color: "#FFC857", borderColor: "rgba(255,200,87,.3)" } : {}}>
                {submitting ? <span className="spinner" /> : timesheet.submitted ? "UNSUBMIT" : "SUBMIT"}
              </button>
            )}
            {timesheet && (
              <div style={{ display: "flex", gap: 2, marginLeft: 8 }}>
                <button 
                  className={`btn ${viewMode === 'day' ? 'btn-primary' : ''}`}
                  onClick={() => setViewMode('day')}
                  style={{ padding: "6px 12px", fontSize: 10 }}
                >Day</button>
                <button 
                  className={`btn ${viewMode === 'week' ? 'btn-primary' : ''}`}
                  onClick={() => setViewMode('week')}
                  style={{ padding: "6px 12px", fontSize: 10 }}
                >Week</button>
              </div>
            )}
            <button className="btn" title="Disconnect" onClick={() => { setSession(null); setTimesheet(null); }}
              style={{ padding: "6px 10px", color: "#555577" }}>⏻</button>
          </div>
        </div>

        {/* ── Progress ── */}
        {timesheet && (
          <div style={{ padding: "10px 40px", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 9, color: "#555577", letterSpacing: ".12em", textTransform: "uppercase", width: 60 }}>Progress</div>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: pctClr }} />
            </div>
            <div style={{ fontSize: 10, color: "#555577", display: "flex", alignItems: "center" }}>
              {(timesheet.totalHours ?? 0).toFixed(2)}h / {timesheet.expectedHours}h
              {timesheet.totalHours > timesheet.expectedHours && (
                <span style={{ color: "#A8E6CF", marginLeft: 8 }}>
                  +{(timesheet.totalHours - timesheet.expectedHours).toFixed(2)}h
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", height: `calc(100vh - ${timesheet ? 154 : 130}px)` }}>
          {/* ── Main timeline area ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 40px" }}>

            {/* Date nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div className="nav-date" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => shiftDate(-1)}>‹</button>
                <span style={{ fontSize: 12, color: "#aaaacc", minWidth: 260 }}>{fmtDate(refDate)}</span>
                <button onClick={() => shiftDate(1)}>›</button>
                <button className="btn" style={{ padding: "4px 12px", fontSize: 10 }} onClick={() => setRefDate(new Date())}>TODAY</button>
              </div>
              {loading && <span className="spinner" />}
            </div>

            {/* Error */}
            {loadErr && (
              <div className="err-box" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ flex: 1 }}>{loadErr}</span>
                <button className="btn" style={{ fontSize: 10, padding: "3px 12px", flexShrink: 0 }} onClick={loadTimesheet}>RETRY</button>
              </div>
            )}

            {/* Legend */}
            {(viewMode === 'week' ? entries : dayEntries).filter(e => !e.breakTime && e.clientName).length > 0 && (
              <div style={{ display: "flex", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
                {(viewMode === 'week' ? entries : dayEntries).filter(e => !e.breakTime && e.clientName).map(e => e.clientName).filter((v, i, a) => a.indexOf(v) === i).map(cn => (
                  <div key={cn} style={{ display: "flex", alignItems: "center", fontSize: 11, color: "#8888aa" }}>
                    <span className="legend-dot" style={{ background: clientColor(cn) }} />{cn}
                  </div>
                ))}
                {(viewMode === 'week' ? entries : dayEntries).some(e => e.breakTime) && (
                  <div style={{ display: "flex", alignItems: "center", fontSize: 11, color: "#8888aa" }}>
                    <span className="legend-dot" style={{ background: "#1c1c2a", border: "1px solid #333" }} />Break
              </div>
            )}

            {/* Leave Section */}
            {leaveEntries.length > 0 && (
              <div style={{ marginTop: 48, borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 28 }}>
                <div style={{ fontSize: 9, letterSpacing: ".2em", color: "#555577", textTransform: "uppercase", marginBottom: 16 }}>
                  Leave ({leaveEntries.length})
                </div>
                {leaveEntries.map(leave => (
                  <div key={leave.id} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", background: "rgba(255,255,255,.03)", borderRadius: 4, marginBottom: 8 
                  }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#c0c0d8" }}>{leave.type}</div>
                      <div style={{ fontSize: 10, color: "#555577", marginTop: 2 }}>
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button className="btn btn-danger" 
                      onClick={async () => {
                        await session.api.deleteLeave(leave.id);
                        setLeaveEntries(leaveEntries.filter(l => l.id !== leave.id));
                        showToast("Leave deleted.", "ok");
                      }}
                      style={{ padding: "4px 12px", fontSize: 10 }}
                    >DELETE</button>
                  </div>
                ))}
              </div>
            )}
          </div>
            )}

            {/* Timeline ruler + blocks */}
            {!loading && !loadErr && (
              viewMode === 'day' ? (
                <div style={{ position: "relative", marginTop: 30 }}>
                  {hours.map(h => {
                    const p = ((h * 60 - DAY_START) / TOTAL_MINS) * 100;
                    return (
                      <div key={h} className="hour-tick" style={{ left: `${p}%` }}>
                        <span className="hour-label">{h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`}</span>
                      </div>
                    );
                  })}
                  {showNow && selectedDateStr === todayPrefix(new Date()) && (
                    <div className="now-line" style={{ left: `${((nowMin - DAY_START) / TOTAL_MINS) * 100}%` }} />
                  )}
                  <div style={{ position: "relative", height: `${Math.max(maxLanes * 66, 80)}px`, marginTop: 8 }}>
                    {laned.map(e => (
                      <div key={e.id}
                        className={`entry-block${selected === e.id ? " sel" : ""}`}
                        style={blockStyle(e)}
                        onClick={() => setSelected(selected === e.id ? null : e.id)}
                        onMouseEnter={() => setHovered(e.id)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <div style={{ padding: "4px 8px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                          <div style={{ fontSize: 11, fontWeight: 500, color: e.breakTime ? "#444466" : "#0c0c14", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>{e.description}</div>
                          <div style={{ fontSize: 10, color: e.breakTime ? "#333344" : "rgba(12,12,20,.55)", marginTop: 2 }}>{fmtTime(e.startTime)} – {fmtTime(e.endTime)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 4, marginTop: 30, overflowX: "auto" }}>
                  {weekDays.map((day, idx) => {
                    const dayStr = todayPrefix(day);
                    const isSelected = dayStr === selectedDateStr;
                    const dayEntries = getEntriesForDate(day);
                    const dayLaned = assignLanes(dayEntries);
                    const dayMaxLanes = dayLaned.length ? Math.max(...dayLaned.map(e => e.lane)) + 1 : 1;
                    const dayName = day.toLocaleDateString([], { weekday: 'short' });
                    const dayNum = day.getDate();
                    const isToday = dayStr === todayPrefix(new Date());
                    
                    return (
                      <div 
                        key={idx}
                        onClick={() => { setRefDate(day); setViewMode('day'); }}
                        style={{ 
                          flex: 1, 
                          minWidth: 100, 
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(255,255,255,.03)' : 'transparent',
                          border: isSelected ? '1px solid rgba(126,200,227,.3)' : '1px solid transparent',
                          borderRadius: 6,
                          padding: 8,
                        }}
                      >
                        <div style={{ 
                          textAlign: 'center', 
                          marginBottom: 8,
                          fontSize: 11,
                          color: isToday ? '#7EC8E3' : '#555577',
                          fontWeight: isToday ? 600 : 400,
                        }}>
                          <div style={{ fontSize: 9, letterSpacing: '.1em' }}>{dayName}</div>
                          <div style={{ fontSize: 14, color: isSelected ? '#e0e0f0' : '#8888aa' }}>{dayNum}</div>
                        </div>
                        <div style={{ position: "relative", height: 120 }}>
                          {hours.filter((_, i) => i % 2 === 0).map(h => {
                            const p = ((h * 60 - DAY_START) / TOTAL_MINS) * 100;
                            return (
                              <div key={h} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, borderLeft: '1px solid rgba(255,255,255,.04)', pointerEvents: 'none' }} />
                            );
                          })}
                          {dayLaned.map(e => {
                            const s = Math.max(toMins(e.startTime), DAY_START);
                            const en = Math.min(toMins(e.endTime), DAY_END);
                            const lh = 100 / dayMaxLanes;
                            return (
                              <div key={e.id}
                                style={{
                                  position: 'absolute',
                                  left: `${((s - DAY_START) / TOTAL_MINS) * 100}%`,
                                  width: `${Math.max(((en - s) / TOTAL_MINS) * 100, 4)}%`,
                                  top: `${e.lane * lh}%`,
                                  height: `${lh - 2}%`,
                                  background: e.breakTime ? "#1c1c2a" : clientColor(e.clientName),
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                }}
                              >
                                <div style={{ fontSize: 8, color: e.breakTime ? '#444' : '#0c0c14', padding: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {e.description}
                                </div>
                              </div>
                            );
                          })}
                          {isToday && (
                            <div style={{ position: 'absolute', left: `${((nowMin - DAY_START) / TOTAL_MINS) * 100}%`, top: 0, bottom: 0, width: 2, background: '#FF6B6B', pointerEvents: 'none' }} />
                          )}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: '#555577' }}>
                          {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Empty state */}
            {!loading && !loadErr && dayEntries.length === 0 && viewMode === 'day' && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#333355", fontSize: 12 }}>
                No entries for this day.
                <div style={{ marginTop: 16 }}>
                  <button className="btn" onClick={() => setModal("add")}>+ Add the first one</button>
                </div>
              </div>
            )}

            {/* Entry list */}
            {entries.length > 0 && !loading && (
              <div style={{ marginTop: 48, borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 28 }}>
                <div style={{ fontSize: 9, letterSpacing: ".2em", color: "#555577", textTransform: "uppercase", marginBottom: 16 }}>
                  All Entries ({entries.length})
                </div>
                {sortedEntries.map(e => (
                  <div key={e.id}
                    className={`entry-row${selected === e.id ? " sel" : ""}`}
                    onClick={() => setSelected(selected === e.id ? null : e.id)}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.breakTime ? "#2a2a3a" : clientColor(e.clientName), border: "1px solid rgba(255,255,255,.15)", flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: "#c0c0d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: "#555577", whiteSpace: "nowrap" }}>{e.clientName || "—"}</div>
                    <div style={{ fontSize: 11, color: "#555577", whiteSpace: "nowrap" }}>{fmtTime(e.startTime)} – {fmtTime(e.endTime)}</div>
                    <div style={{ fontSize: 11, color: "#7EC8E3", whiteSpace: "nowrap" }}>{fmtDur(e.startTime, e.endTime)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Detail panel ── */}
          <div style={{ width: sel ? 300 : 0, overflow: "hidden", transition: "width .25s ease", borderLeft: "1px solid rgba(255,255,255,.05)", background: "#0f0f1a", flexShrink: 0 }}>
            {sel && (
              <div style={{ width: 300, padding: 28, height: "100%", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ paddingRight: 12 }}>
                    <div style={{ fontSize: 9, letterSpacing: ".15em", color: "#555577", textTransform: "uppercase", marginBottom: 6 }}>Entry #{sel.id}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#e0e0f0", lineHeight: 1.3 }}>{sel.description}</div>
                  </div>
                  <button className="btn" style={{ padding: "4px 10px", fontSize: 14, flexShrink: 0 }} onClick={() => setSelected(null)}>✕</button>
                </div>

                <div style={{ height: 3, background: sel.breakTime ? "#2a2a3a" : clientColor(sel.clientName), borderRadius: 2, marginBottom: 22 }} />

                {[
                  ["Time",      `${fmtTime(sel.startTime)} → ${fmtTime(sel.endTime)}`],
                  ["Duration",  fmtDur(sel.startTime, sel.endTime), "#7EC8E3"],
                  sel.clientName   && ["Client",    sel.clientName],
                  sel.projectName  && ["Project",   sel.projectName],
                  sel.itemName     && ["Item",       sel.itemName],
                  sel.locationName && ["Location",   sel.locationName],
                  sel.taskIssue    && ["Task/Issue", sel.taskIssue],
                  sel.comment      && ["Comment",    sel.comment],
                  sel.adminComment && ["Admin note", sel.adminComment],
                ].filter(Boolean).map(([label, val, color]) => (
                  <div className="detail-row" key={label}>
                    <span className="detail-label">{label}</span>
                    <span className="detail-value" style={color ? { color } : {}}>{val}</span>
                  </div>
                ))}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {sel.billable   && <span className="tag">BILLABLE</span>}
                  {sel.breakTime  && <span className="tag">BREAK</span>}
                  {!sel.billable && !sel.breakTime && <span className="tag">NON-BILLABLE</span>}
                </div>

                <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setModal(sel)}
                    disabled={timesheet?.approved}>EDIT</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(sel.id)}
                    disabled={deletingId === sel.id || timesheet?.approved}>
                    {deletingId === sel.id ? <span className="spinner" /> : "DELETE"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Entry Modal ── */}
        {modal && (
          <EntryModal
            entry={modal === "add" ? null : modal}
            timesheetId={timesheet?.id}
            refDate={refDate}
            api={session.api}
            clients={clients}
            projects={projects}
            items={items}
            locations={locations}
            favourites={favourites}
            session={session}
            onSave={async () => {
              setModal(null);
              showToast(modal === "add" ? "Entry added!" : "Entry updated.", "ok");
              await loadTimesheet();
            }}
            onSaveFavourite={async (fav) => {
              await session.api.addFavourite({ ...fav, employeeId: session.employee.id });
              const favs = await session.api.getFavourites(session.employee.id);
              setFavourites(favs || []);
              showToast("Favourite saved!", "ok");
            }}
            onDeleteFavourite={async (id) => {
              await session.api.deleteFavourite(id);
              setFavourites(favourites.filter(f => f.id !== id));
              showToast("Favourite deleted.", "ok");
            }}
            onClose={() => setModal(null)}
          />
        )}

        {/* ── Leave Modal ── */}
        {modal === "addLeave" && (
          <LeaveModal
            leaveTypes={leaveTypes}
            onSave={async (leave) => {
              await session.api.addLeave(session.employee.id, leave);
              const leaves = await session.api.getLeaves(session.employee.id);
              setLeaveEntries(leaves || []);
              setModal(null);
              showToast("Leave added!", "ok");
            }}
            onClose={() => setModal(null)}
          />
        )}

        {/* ── Toast ── */}
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    </>
  );
}
