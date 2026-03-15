const express = require('express');
const proxy = require('express-http-proxy');
const dns = require('dns');
const path = require('path');
const initSqlJs = require('sql.js');

const app = express();
app.use(express.json());

const targetHost = 'zookeeper.zoodata.com.au';
let cachedIp = null;

let db = null;

async function initDb() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'daytracker.db');
  const fs = require('fs');
  
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  } catch (err) {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS day_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT DEFAULT 'active',
      target_seconds INTEGER NOT NULL,
      total_worked_seconds INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_session_id INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      event_type TEXT NOT NULL,
      item_id INTEGER,
      item_name TEXT,
      project_id INTEGER,
      project_name TEXT,
      client_id INTEGER,
      client_name TEXT,
      duration_seconds INTEGER DEFAULT 0,
      FOREIGN KEY (day_session_id) REFERENCES day_sessions(id)
    )
  `);

  saveDb();
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const fs = require('fs');
  fs.writeFileSync(path.join(__dirname, 'daytracker.db'), buffer);
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

function startServer() {
  app.use('/api', proxy(`https://${targetHost}/api`, {
    proxyReqPathResolver: (req) => {
      return req.url;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      console.log(`[OUT] ${srcReq.method} ${srcReq.url} -> ${targetHost} (${cachedIp || 'pending'})`);
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      
      const status = proxyRes.statusCode;
      const location = proxyRes.headers.location;
      if (status >= 300 && status < 400 && location) {
        console.log(`[REDIRECT] ${status} ${userReq.url} -> ${location}`);
      }
      console.log(`[RESP] ${userReq.method} ${userReq.url} <- ${status}`);
      return proxyResData;
    }
  }));

  app.use('/appsettings.json', proxy(`https://${targetHost}/appsettings.json`, {
    proxyReqPathResolver: (req) => {
      return '/appsettings.json';
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      console.log(`[OUT] ${srcReq.method} /appsettings.json -> ${targetHost} (${cachedIp || 'pending'})`);
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      console.log(`[RESP] ${userReq.method} /appsettings.json <- ${proxyRes.statusCode}`);
      return proxyResData;
    }
  }));

  app.use('/oauth/devicecode', proxy('https://login.microsoftonline.com', {
    proxyReqPathResolver: (req) => {
      const match = req.url.match(/^\/([^/]+)/);
      const tenantId = match ? match[1] : '';
      return `/${tenantId}/oauth2/v2.0/devicecode`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      delete proxyReqOpts.headers['Origin'];
      delete proxyReqOpts.headers['Referer'];
      console.log(`[OUT] ${srcReq.method} ${srcReq.url} -> login.microsoftonline.com`);
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      console.log(`[RESP] ${userReq.method} /oauth/devicecode <- ${proxyRes.statusCode}`);
      return proxyResData;
    }
  }));

  app.use('/oauth/token', proxy('https://login.microsoftonline.com', {
    proxyReqPathResolver: (req) => {
      const match = req.url.match(/^\/([^/]+)/);
      const tenantId = match ? match[1] : '';
      return `/${tenantId}/oauth2/v2.0/token`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      delete proxyReqOpts.headers['Origin'];
      delete proxyReqOpts.headers['Referer'];
      console.log(`[OUT] ${srcReq.method} ${srcReq.url} -> login.microsoftonline.com`);
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      console.log(`[RESP] ${userReq.method} /oauth/token <- ${proxyRes.statusCode}`);
      return proxyResData;
    }
  }));

  app.use(express.static(path.join(__dirname, 'dist')));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });

  const PORT = process.env.PORT || 3131;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

app.get('/api-local/day-sessions/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const date = req.query.date || getTodayDate();

  try {
    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    sessionStmt.bind([employeeId, date, 'active']);
    
    let session = null;
    if (sessionStmt.step()) {
      session = sessionStmt.getAsObject();
    }
    sessionStmt.free();

    if (!session) {
      return res.json(null);
    }

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    eventsStmt.bind([session.id]);
    
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    res.json({ session, events });
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api-local/day-sessions/:employeeId/closed', (req, res) => {
  const { employeeId } = req.params;
  const date = req.query.date || getTodayDate();

  try {
    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    sessionStmt.bind([employeeId, date, 'closed']);
    
    let session = null;
    if (sessionStmt.step()) {
      session = sessionStmt.getAsObject();
    }
    sessionStmt.free();

    if (!session) {
      return res.json(null);
    }

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    eventsStmt.bind([session.id]);
    
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    res.json({ session, events });
  } catch (err) {
    console.error('Error fetching closed session:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api-local/day-sessions/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const { itemId, itemName, projectId, projectName, clientId, clientName, targetSeconds } = req.body;
  const date = getTodayDate();
  const now = new Date().toISOString();

  try {
    const existingStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    existingStmt.bind([employeeId, date, 'active']);
    const existing = existingStmt.step() ? existingStmt.getAsObject() : null;
    existingStmt.free();

    if (existing) {
      return res.status(400).json({ error: 'Active session already exists for today' });
    }

    db.run('INSERT INTO day_sessions (employee_id, date, start_time, status, target_seconds) VALUES (?, ?, ?, ?, ?)',
      [employeeId, date, now, 'active', targetSeconds]);

    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const sessionId = lastIdStmt.getAsObject().id;
    lastIdStmt.free();

    db.run(`INSERT INTO activity_events (day_session_id, timestamp, event_type, item_id, item_name, project_id, project_name, client_id, client_name)
      VALUES (?, ?, 'start_day', ?, ?, ?, ?, ?, ?)`,
      [sessionId, now, itemId, itemName, projectId, projectName, clientId, clientName]);

    saveDb();

    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE id = ?');
    sessionStmt.bind([sessionId]);
    sessionStmt.step();
    const session = sessionStmt.getAsObject();
    sessionStmt.free();

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    eventsStmt.bind([sessionId]);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    res.json({ session, events });
  } catch (err) {
    console.error('Error starting session:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api-local/day-sessions/:employeeId/push', (req, res) => {
  const { employeeId } = req.params;
  const { itemId, itemName, projectId, projectName, clientId, clientName } = req.body;
  const date = getTodayDate();
  const now = new Date().toISOString();

  try {
    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    sessionStmt.bind([employeeId, date, 'active']);
    const session = sessionStmt.step() ? sessionStmt.getAsObject() : null;
    sessionStmt.free();

    if (!session) {
      return res.status(404).json({ error: 'No active session' });
    }

    const lastEventStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp DESC LIMIT 1');
    lastEventStmt.bind([session.id]);
    const lastEvent = lastEventStmt.step() ? lastEventStmt.getAsObject() : null;
    lastEventStmt.free();

    if (lastEvent && lastEvent.event_type === 'push') {
      return res.status(400).json({ error: 'Already at a pushed activity. Pop first.' });
    }

    let durationSeconds = 0;
    if (lastEvent && lastEvent.event_type !== 'pause' && lastEvent.event_type !== 'resume') {
      const lastTime = new Date(lastEvent.timestamp).getTime();
      const nowTime = new Date(now).getTime();
      durationSeconds = Math.floor((nowTime - lastTime) / 1000);

      if (lastEvent.item_id) {
        db.run('UPDATE activity_events SET duration_seconds = ? WHERE id = ?', [durationSeconds, lastEvent.id]);
        db.run('UPDATE day_sessions SET total_worked_seconds = total_worked_seconds + ? WHERE id = ?', [durationSeconds, session.id]);
      }
    }

    db.run(`INSERT INTO activity_events (day_session_id, timestamp, event_type, item_id, item_name, project_id, project_name, client_id, client_name)
      VALUES (?, ?, 'push', ?, ?, ?, ?, ?, ?)`,
      [session.id, now, itemId, itemName, projectId, projectName, clientId, clientName]);

    saveDb();

    const updatedSessionStmt = db.prepare('SELECT * FROM day_sessions WHERE id = ?');
    updatedSessionStmt.bind([session.id]);
    updatedSessionStmt.step();
    const updatedSession = updatedSessionStmt.getAsObject();
    updatedSessionStmt.free();

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    eventsStmt.bind([session.id]);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    res.json({ session: updatedSession, events });
  } catch (err) {
    console.error('Error pushing activity:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api-local/day-sessions/:employeeId/pop', (req, res) => {
  const { employeeId } = req.params;
  const date = getTodayDate();
  const now = new Date().toISOString();

  try {
    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    sessionStmt.bind([employeeId, date, 'active']);
    const session = sessionStmt.step() ? sessionStmt.getAsObject() : null;
    sessionStmt.free();

    if (!session) {
      return res.status(404).json({ error: 'No active session' });
    }

    const pushEventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? AND event_type = ? ORDER BY timestamp DESC');
    pushEventsStmt.bind([session.id, 'push']);
    const pushEvents = [];
    while (pushEventsStmt.step()) {
      pushEvents.push(pushEventsStmt.getAsObject());
    }
    pushEventsStmt.free();

    if (pushEvents.length === 0) {
      return res.status(400).json({ error: 'No pushed activities to pop' });
    }

    const lastPush = pushEvents[0];

    const lastEventStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp DESC LIMIT 1');
    lastEventStmt.bind([session.id]);
    const lastEvent = lastEventStmt.step() ? lastEventStmt.getAsObject() : null;
    lastEventStmt.free();

    if (lastEvent && lastEvent.event_type !== 'pause' && lastEvent.event_type !== 'resume') {
      const lastTime = new Date(lastEvent.timestamp).getTime();
      const nowTime = new Date(now).getTime();
      const durationSeconds = Math.floor((nowTime - lastTime) / 1000);

      if (lastEvent.item_id) {
        db.run('UPDATE activity_events SET duration_seconds = ? WHERE id = ?', [durationSeconds, lastEvent.id]);
        db.run('UPDATE day_sessions SET total_worked_seconds = total_worked_seconds + ? WHERE id = ?', [durationSeconds, session.id]);
      }
    }

    const startDayStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? AND event_type = ? ORDER BY timestamp ASC LIMIT 1');
    startDayStmt.bind([session.id, 'start_day']);
    const startDayEvent = startDayStmt.step() ? startDayStmt.getAsObject() : null;
    startDayStmt.free();

    const returnToItem = startDayEvent || pushEvents[1] || null;

    db.run(`INSERT INTO activity_events (day_session_id, timestamp, event_type, item_id, item_name, project_id, project_name, client_id, client_name)
      VALUES (?, ?, 'pop', ?, ?, ?, ?, ?, ?)`,
      [
        session.id, now,
        returnToItem?.item_id || null,
        returnToItem?.item_name || null,
        returnToItem?.project_id || null,
        returnToItem?.project_name || null,
        returnToItem?.client_id || null,
        returnToItem?.client_name || null
      ]);

    saveDb();

    const updatedSessionStmt = db.prepare('SELECT * FROM day_sessions WHERE id = ?');
    updatedSessionStmt.bind([session.id]);
    updatedSessionStmt.step();
    const updatedSession = updatedSessionStmt.getAsObject();
    updatedSessionStmt.free();

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    eventsStmt.bind([session.id]);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    res.json({ session: updatedSession, events });
  } catch (err) {
    console.error('Error popping activity:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api-local/day-sessions/:employeeId/pause', (req, res) => {
  const { employeeId } = req.params;
  const date = getTodayDate();
  const now = new Date().toISOString();

  try {
    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    sessionStmt.bind([employeeId, date, 'active']);
    const session = sessionStmt.step() ? sessionStmt.getAsObject() : null;
    sessionStmt.free();

    if (!session) {
      return res.status(404).json({ error: 'No active session' });
    }

    const lastEventStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp DESC LIMIT 1');
    lastEventStmt.bind([session.id]);
    const lastEvent = lastEventStmt.step() ? lastEventStmt.getAsObject() : null;
    lastEventStmt.free();

    if (lastEvent && lastEvent.event_type === 'pause') {
      return res.status(400).json({ error: 'Already paused' });
    }

    if (lastEvent && lastEvent.event_type !== 'resume') {
      const lastTime = new Date(lastEvent.timestamp).getTime();
      const nowTime = new Date(now).getTime();
      const durationSeconds = Math.floor((nowTime - lastTime) / 1000);

      if (lastEvent.item_id) {
        db.run('UPDATE activity_events SET duration_seconds = ? WHERE id = ?', [durationSeconds, lastEvent.id]);
        db.run('UPDATE day_sessions SET total_worked_seconds = total_worked_seconds + ? WHERE id = ?', [durationSeconds, session.id]);
      }
    }

    db.run('INSERT INTO activity_events (day_session_id, timestamp, event_type) VALUES (?, ?, ?)',
      [session.id, now, 'pause']);

    saveDb();

    const updatedSessionStmt = db.prepare('SELECT * FROM day_sessions WHERE id = ?');
    updatedSessionStmt.bind([session.id]);
    updatedSessionStmt.step();
    const updatedSession = updatedSessionStmt.getAsObject();
    updatedSessionStmt.free();

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    eventsStmt.bind([session.id]);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    res.json({ session: updatedSession, events });
  } catch (err) {
    console.error('Error pausing:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api-local/day-sessions/:employeeId/resume', (req, res) => {
  const { employeeId } = req.params;
  const date = getTodayDate();
  const now = new Date().toISOString();

  try {
    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    sessionStmt.bind([employeeId, date, 'active']);
    const session = sessionStmt.step() ? sessionStmt.getAsObject() : null;
    sessionStmt.free();

    if (!session) {
      return res.status(404).json({ error: 'No active session' });
    }

    const lastEventStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp DESC LIMIT 1');
    lastEventStmt.bind([session.id]);
    const lastEvent = lastEventStmt.step() ? lastEventStmt.getAsObject() : null;
    lastEventStmt.free();

    if (!lastEvent || lastEvent.event_type !== 'pause') {
      return res.status(400).json({ error: 'Not currently paused' });
    }

    const pauseTime = new Date(lastEvent.timestamp).getTime();
    const nowTime = new Date(now).getTime();
    const breakDuration = Math.floor((nowTime - pauseTime) / 1000);
    db.run('UPDATE activity_events SET duration_seconds = ? WHERE id = ?', [breakDuration, lastEvent.id]);

    db.run('INSERT INTO activity_events (day_session_id, timestamp, event_type) VALUES (?, ?, ?)',
      [session.id, now, 'resume']);

    saveDb();

    const updatedSessionStmt = db.prepare('SELECT * FROM day_sessions WHERE id = ?');
    updatedSessionStmt.bind([session.id]);
    updatedSessionStmt.step();
    const updatedSession = updatedSessionStmt.getAsObject();
    updatedSessionStmt.free();

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    eventsStmt.bind([session.id]);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    res.json({ session: updatedSession, events });
  } catch (err) {
    console.error('Error resuming:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api-local/day-sessions/:employeeId/end', async (req, res) => {
  const { employeeId } = req.params;
  const { authToken } = req.body;
  const date = getTodayDate();
  const now = new Date().toISOString();

  try {
    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    sessionStmt.bind([employeeId, date, 'active']);
    const session = sessionStmt.step() ? sessionStmt.getAsObject() : null;
    sessionStmt.free();

    if (!session) {
      return res.status(404).json({ error: 'No active session' });
    }

    const lastEventStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp DESC LIMIT 1');
    lastEventStmt.bind([session.id]);
    const lastEvent = lastEventStmt.step() ? lastEventStmt.getAsObject() : null;
    lastEventStmt.free();

    if (lastEvent && lastEvent.event_type !== 'pause' && lastEvent.event_type !== 'resume') {
      const lastTime = new Date(lastEvent.timestamp).getTime();
      const nowTime = new Date(now).getTime();
      const durationSeconds = Math.floor((nowTime - lastTime) / 1000);

      if (lastEvent.item_id) {
        db.run('UPDATE activity_events SET duration_seconds = ? WHERE id = ?', [durationSeconds, lastEvent.id]);
        db.run('UPDATE day_sessions SET total_worked_seconds = total_worked_seconds + ? WHERE id = ?', [durationSeconds, session.id]);
      }
    }

    db.run('INSERT INTO activity_events (day_session_id, timestamp, event_type) VALUES (?, ?, ?)',
      [session.id, now, 'end_day']);

    db.run('UPDATE day_sessions SET end_time = ?, status = ? WHERE id = ?', [now, 'closed', session.id]);

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? AND item_id IS NOT NULL AND duration_seconds > 0 ORDER BY timestamp ASC');
    eventsStmt.bind([session.id]);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    const entries = events.map(event => ({
      id: 0,
      description: event.item_name || 'Work',
      taskIssue: null,
      comment: null,
      billable: true,
      breakTime: false,
      startTime: null,
      endTime: null,
      adminComment: null,
      duration: `PT${event.duration_seconds}S`,
      unallocatedTime: false,
      itemId: event.item_id,
      itemName: event.item_name,
      projectId: event.project_id,
      projectName: event.project_name,
      clientId: event.client_id,
      clientName: event.client_name,
      locationId: null,
      locationName: null,
      timesheetId: null
    }));

    const createdEntries = [];
    for (const entry of entries) {
      try {
        const response = await fetch(`https://${targetHost}/api/Entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(entry)
        });

        if (response.ok) {
          const entryId = await response.text();
          createdEntries.push({ ...entry, id: parseInt(entryId) });
        } else {
          console.error('Failed to create entry:', response.status, await response.text());
        }
      } catch (err) {
        console.error('Error creating entry:', err);
      }
    }

    saveDb();

    const updatedSessionStmt = db.prepare('SELECT * FROM day_sessions WHERE id = ?');
    updatedSessionStmt.bind([session.id]);
    updatedSessionStmt.step();
    const updatedSession = updatedSessionStmt.getAsObject();
    updatedSessionStmt.free();

    const allEventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    allEventsStmt.bind([session.id]);
    const allEvents = [];
    while (allEventsStmt.step()) {
      allEvents.push(allEventsStmt.getAsObject());
    }
    allEventsStmt.free();

    res.json({ session: updatedSession, events: allEvents, entries: createdEntries });
  } catch (err) {
    console.error('Error ending session:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api-local/day-sessions/:employeeId/reopen', (req, res) => {
  const { employeeId } = req.params;
  const { itemId, itemName, projectId, projectName, clientId, clientName } = req.body || {};
  const date = getTodayDate();
  const now = new Date().toISOString();

  try {
    const sessionStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    sessionStmt.bind([employeeId, date, 'closed']);
    const session = sessionStmt.step() ? sessionStmt.getAsObject() : null;
    sessionStmt.free();

    if (!session) {
      return res.status(404).json({ error: 'No closed session found for today' });
    }

    db.run('UPDATE day_sessions SET status = ?, end_time = NULL WHERE id = ?', ['active', session.id]);

    const lastEventStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp DESC LIMIT 1');
    lastEventStmt.bind([session.id]);
    const lastEvent = lastEventStmt.step() ? lastEventStmt.getAsObject() : null;
    lastEventStmt.free();

    const resumeToItem = itemId ? {
      item_id: itemId,
      item_name: itemName,
      project_id: projectId,
      project_name: projectName,
      client_id: clientId,
      client_name: clientName
    } : (lastEvent?.item_id ? {
      item_id: lastEvent.item_id,
      item_name: lastEvent.item_name,
      project_id: lastEvent.project_id,
      project_name: lastEvent.project_name,
      client_id: lastEvent.client_id,
      client_name: lastEvent.client_name
    } : null);

    db.run(`INSERT INTO activity_events (day_session_id, timestamp, event_type, item_id, item_name, project_id, project_name, client_id, client_name)
      VALUES (?, ?, 'reopen_day', ?, ?, ?, ?, ?, ?)`,
      [
        session.id, now,
        resumeToItem?.item_id || null,
        resumeToItem?.item_name || null,
        resumeToItem?.project_id || null,
        resumeToItem?.project_name || null,
        resumeToItem?.client_id || null,
        resumeToItem?.client_name || null
      ]);

    saveDb();

    const updatedSessionStmt = db.prepare('SELECT * FROM day_sessions WHERE id = ?');
    updatedSessionStmt.bind([session.id]);
    updatedSessionStmt.step();
    const updatedSession = updatedSessionStmt.getAsObject();
    updatedSessionStmt.free();

    const eventsStmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
    eventsStmt.bind([session.id]);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();

    res.json({ session: updatedSession, events });
  } catch (err) {
    console.error('Error reopening session:', err);
    res.status(500).json({ error: err.message });
  }
});

dns.resolve4(targetHost, async (err, addresses) => {
  if (err) {
    console.error(`DNS resolution failed: ${err.message}`);
    cachedIp = 'resolution-failed';
  } else {
    cachedIp = addresses[0];
    console.log(`Resolved ${targetHost} -> ${cachedIp}`);
  }
  await initDb();
  startServer();
});
