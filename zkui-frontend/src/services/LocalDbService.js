import initSqlJs from 'sql.js';

let db = null;
let dbPath = 'daytracker.db';

export async function initLocalDb() {
  const SQL = await initSqlJs();
  
  const isNative = window.Capacitor?.isNativePlatform?.() === true;
  const { FilesystemDirectory, Plugins } = isNative ? window.Capacitor.Plugins : null;
  
  try {
    if (isNative && FilesystemDirectory) {
      const { readFile, writeFile, getUri, mkdir, exists } = Plugins.Filesystem;
      
      const dirResult = await getUri({ directory: FilesystemDirectory.Documents, path: '' });
      const dbDir = dirResult.uri.replace(/[^/]*$/, '') + 'zkui';
      
      try {
        await mkdir({ directory: FilesystemDirectory.Documents, path: 'zkui', recursive: true });
      } catch (e) {
        // Directory may already exist
      }
      
      const filePath = 'zkui/' + dbPath;
      const fileExists = await exists({ directory: FilesystemDirectory.Documents, path: filePath });
      
      if (fileExists) {
        const result = await readFile({ directory: FilesystemDirectory.Documents, path: filePath });
        const uint8Array = new Uint8Array(result);
        db = new SQL.Database(uint8Array);
      } else {
        db = new SQL.Database();
      }
    } else {
      const stored = localStorage.getItem('zkui_db');
      if (stored) {
        const uint8Array = new Uint8Array(JSON.parse(stored));
        db = new SQL.Database(uint8Array);
      } else {
        db = new SQL.Database();
      }
    }
  } catch (err) {
    console.error('Error loading DB:', err);
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
      timezone_offset INTEGER,
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
      location_id INTEGER,
      location_name TEXT,
      issue TEXT,
      comment TEXT,
      billable INTEGER DEFAULT 1,
      duration_seconds INTEGER DEFAULT 0,
      FOREIGN KEY (day_session_id) REFERENCES day_sessions(id)
    )
  `);

  try {
    db.run('ALTER TABLE activity_events ADD COLUMN location_id INTEGER');
    db.run('ALTER TABLE activity_events ADD COLUMN location_name TEXT');
    db.run('ALTER TABLE activity_events ADD COLUMN issue TEXT');
    db.run('ALTER TABLE activity_events ADD COLUMN comment TEXT');
    db.run('ALTER TABLE activity_events ADD COLUMN billable INTEGER DEFAULT 1');
  } catch (e) {
    // Columns may already exist
  }

  await saveDb();
}

export async function saveDb() {
  if (!db) return;
  
  const data = db.export();
  const isNative = window.Capacitor?.isNativePlatform?.() === true;
  const { FilesystemDirectory, Plugins } = isNative ? window.Capacitor.Plugins : null;
  
  if (isNative && FilesystemDirectory) {
    try {
      const { writeFile } = Plugins.Filesystem;
      await writeFile({
        directory: FilesystemDirectory.Documents,
        path: 'zkui/' + dbPath,
        data: Array.from(data),
        encoding: 'utf8'
      });
    } catch (err) {
      console.error('Error saving DB to filesystem:', err);
    }
  } else {
    try {
      localStorage.setItem('zkui_db', JSON.stringify(Array.from(data)));
    } catch (err) {
      console.error('Error saving DB to localStorage:', err);
    }
  }
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const LocalDbService = {
  getDaySession: async (employeeId) => {
    const date = getTodayDate();
    return getSessionByStatus(employeeId, date, 'active');
  },

  getClosedSession: async (employeeId) => {
    const date = getTodayDate();
    return getSessionByStatus(employeeId, date, 'closed');
  },

  startDay: async (employeeId, data) => {
    const date = getTodayDate();
    const now = new Date().toISOString();
    const { 
      itemId, itemName, projectId, projectName, 
      clientId, clientName, 
      locationId = null,
      locationName = '',
      issue = null,
      comment = null,
      billable = true,
      targetSeconds,
      timezoneOffset = null
    } = data;

    const existingStmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
    existingStmt.bind([employeeId, date, 'active']);
    const existing = existingStmt.step() ? existingStmt.getAsObject() : null;
    existingStmt.free();

    if (existing) {
      throw new Error('Active session already exists for today');
    }

    db.run('INSERT INTO day_sessions (employee_id, date, start_time, status, target_seconds, timezone_offset) VALUES (?, ?, ?, ?, ?, ?)',
      [employeeId, date, now, 'active', targetSeconds, timezoneOffset]);

    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const sessionId = lastIdStmt.getAsObject().id;
    lastIdStmt.free();

    db.run(`INSERT INTO activity_events 
      (day_session_id, timestamp, event_type, item_id, item_name, project_id, project_name, client_id, client_name, location_id, location_name, issue, comment, billable)
      VALUES (?, ?, 'start_day', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, now, itemId, itemName, projectId, projectName, clientId, clientName, locationId, locationName, issue || null, comment || null, billable !== false ? 1 : 0]);

    await saveDb();

    return getSessionById(sessionId);
  },

  pushActivity: async (employeeId, data) => {
    const date = getTodayDate();
    const now = new Date().toISOString();
    const {
      itemId, itemName, projectId, projectName,
      clientId, clientName,
      locationId = null,
      locationName = '',
      issue = null,
      comment = null,
      billable = true
    } = data;

    const session = getActiveSession(employeeId, date);
    if (!session) {
      throw new Error('No active session');
    }

    const lastEvent = getLastEvent(session.id);
    
    if (lastEvent && lastEvent.event_type === 'push') {
      throw new Error('Already at a pushed activity. Pop first.');
    }

    const lastWorkEvent = getLastWorkEvent(session.id);
    
    const isLogicallySame = 
      lastWorkEvent && 
      lastWorkEvent.item_id === itemId &&
      (locationId || null) === (lastWorkEvent.location_id) &&
      (issue || null) === (lastWorkEvent.issue || null) &&
      (comment || null) === (lastWorkEvent.comment || null) &&
      (billable !== false ? 1 : 0) === lastWorkEvent.billable;

    if (isLogicallySame) {
      return getSessionById(session.id);
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

    const inheritLocation = locationId ? null : (lastEvent?.location_id ? {
      location_id: lastEvent.location_id,
      location_name: lastEvent.location_name
    } : null);

    db.run(`INSERT INTO activity_events 
      (day_session_id, timestamp, event_type, item_id, item_name, project_id, project_name, client_id, client_name, location_id, location_name, issue, comment, billable)
      VALUES (?, ?, 'push', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [session.id, now, itemId, itemName, projectId, projectName, clientId, clientName, 
       locationId || inheritLocation?.location_id || null, 
       locationName || inheritLocation?.location_name || null,
       issue || null, comment || null, billable !== false ? 1 : 0]);

    await saveDb();

    return getSessionById(session.id);
  },

  popActivity: async (employeeId) => {
    const date = getTodayDate();
    const now = new Date().toISOString();

    const session = getActiveSession(employeeId, date);
    if (!session) {
      throw new Error('No active session');
    }

    const pushEvents = getPushEvents(session.id);
    if (pushEvents.length === 0) {
      throw new Error('No pushed activities to pop');
    }

    const lastPush = pushEvents[0];
    const lastEvent = getLastEvent(session.id);

    if (lastEvent && lastEvent.event_type !== 'pause' && lastEvent.event_type !== 'resume') {
      const lastTime = new Date(lastEvent.timestamp).getTime();
      const nowTime = new Date(now).getTime();
      const durationSeconds = Math.floor((nowTime - lastTime) / 1000);

      if (lastEvent.item_id) {
        db.run('UPDATE activity_events SET duration_seconds = ? WHERE id = ?', [durationSeconds, lastEvent.id]);
        db.run('UPDATE day_sessions SET total_worked_seconds = total_worked_seconds + ? WHERE id = ?', [durationSeconds, session.id]);
      }
    }

    const startDayEvent = getStartDayEvent(session.id);
    const returnToItem = startDayEvent || pushEvents[1] || null;

    const currentWorkEvent = getCurrentWorkEvent(session.id);

    const isLogicallySame = 
      returnToItem &&
      currentWorkEvent &&
      returnToItem.item_id === currentWorkEvent.item_id &&
      (returnToItem.location_id || null) === (currentWorkEvent.location_id || null) &&
      (returnToItem.issue || null) === (currentWorkEvent.issue || null) &&
      (returnToItem.comment || null) === (currentWorkEvent.comment || null) &&
      returnToItem.billable === currentWorkEvent.billable;

    if (isLogicallySame) {
      return getSessionById(session.id);
    }

    db.run(`INSERT INTO activity_events 
      (day_session_id, timestamp, event_type, item_id, item_name, project_id, project_name, client_id, client_name, location_id, location_name, issue, comment, billable)
      VALUES (?, ?, 'pop', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id, now,
        returnToItem?.item_id || null,
        returnToItem?.item_name || null,
        returnToItem?.project_id || null,
        returnToItem?.project_name || null,
        returnToItem?.client_id || null,
        returnToItem?.client_name || null,
        returnToItem?.location_id || null,
        returnToItem?.location_name || null,
        returnToItem?.issue || null,
        returnToItem?.comment || null,
        returnToItem?.billable !== 0 ? 1 : 0
      ]);

    await saveDb();

    return getSessionById(session.id);
  },

  pauseDay: async (employeeId) => {
    const date = getTodayDate();
    const now = new Date().toISOString();

    const session = getActiveSession(employeeId, date);
    if (!session) {
      throw new Error('No active session');
    }

    const lastEvent = getLastEvent(session.id);

    if (lastEvent && lastEvent.event_type === 'pause') {
      throw new Error('Already paused');
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

    await saveDb();

    return getSessionById(session.id);
  },

  resumeDay: async (employeeId) => {
    const date = getTodayDate();
    const now = new Date().toISOString();

    const session = getActiveSession(employeeId, date);
    if (!session) {
      throw new Error('No active session');
    }

    const lastEvent = getLastEvent(session.id);

    if (!lastEvent || lastEvent.event_type !== 'pause') {
      throw new Error('Not currently paused');
    }

    const pauseTime = new Date(lastEvent.timestamp).getTime();
    const nowTime = new Date(now).getTime();
    const breakDuration = Math.floor((nowTime - pauseTime) / 1000);
    db.run('UPDATE activity_events SET duration_seconds = ? WHERE id = ?', [breakDuration, lastEvent.id]);

    db.run('INSERT INTO activity_events (day_session_id, timestamp, event_type) VALUES (?, ?, ?)',
      [session.id, now, 'resume']);

    await saveDb();

    return getSessionById(session.id);
  },

  endDay: async (employeeId, authToken) => {
    const date = getTodayDate();
    const now = new Date().toISOString();

    const session = getActiveSession(employeeId, date);
    if (!session) {
      throw new Error('No active session');
    }

    const lastEvent = getLastEvent(session.id);

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

    const events = getSessionEvents(session.id);
    const workEvents = events.filter(e => e.item_id && e.duration_seconds > 0);

    const mergedEvents = [];
    for (const event of workEvents) {
      const last = mergedEvents[mergedEvents.length - 1];
      const isSame = 
        last && 
        last.item_id === event.item_id &&
        (last.location_id || null) === (event.location_id || null) &&
        (last.issue || null) === (event.issue || null) &&
        (last.comment || null) === (event.comment || null) &&
        last.billable === event.billable;
      
      if (isSame) {
        last.duration_seconds += event.duration_seconds;
      } else {
        mergedEvents.push({ ...event });
      }
    }

    let currentTime = new Date(session.start_time).getTime();
    
    const formatDateTime = (timestamp) => {
      const d = new Date(timestamp);
      const tzOffset = session.timezone_offset ?? d.getTimezoneOffset();
      d.setMinutes(d.getMinutes() + tzOffset);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    
    const formatDuration = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const entries = mergedEvents.map(event => {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime + event.duration_seconds * 1000);
      currentTime = endTime.getTime();
      
      return {
        Id: 0,
        Description: event.item_name || 'Work',
        TaskIssue: event.issue || null,
        Comment: event.comment || null,
        Billable: event.billable !== 0,
        BreakTime: false,
        StartTime: formatDateTime(startTime),
        EndTime: formatDateTime(endTime),
        AdminComment: null,
        Duration: formatDuration(event.duration_seconds),
        UnallocatedTime: false,
        ItemId: event.item_id,
        ItemName: event.item_name,
        ProjectId: event.project_id,
        ProjectName: event.project_name,
        ClientId: event.client_id,
        ClientName: event.client_name,
        LocationId: event.location_id,
        LocationName: event.location_name
      };
    });

    return {
      session: getSessionById(session.id).then(r => r.session),
      events: getSessionEvents(session.id),
      entries
    };
  },

  reopenDay: async (employeeId, data = {}) => {
    const date = getTodayDate();
    const now = new Date().toISOString();
    const {
      itemId, itemName, projectId, projectName,
      clientId, clientName,
      locationId = null,
      locationName = '',
      issue = null,
      comment = null,
      billable = true,
      timezoneOffset = null
    } = data;

    const session = getClosedSessionByDate(employeeId, date);
    if (!session) {
      throw new Error('No closed session found for today');
    }

    db.run('UPDATE day_sessions SET status = ?, end_time = NULL, timezone_offset = ? WHERE id = ?', 
      ['active', timezoneOffset, session.id]);

    const lastEvent = getLastEvent(session.id);

    const resumeToItem = itemId ? {
      item_id: itemId,
      item_name: itemName,
      project_id: projectId,
      project_name: projectName,
      client_id: clientId,
      client_name: clientName,
      location_id: locationId,
      location_name: locationName,
      issue: issue,
      comment: comment,
      billable: billable
    } : (lastEvent?.item_id ? {
      item_id: lastEvent.item_id,
      item_name: lastEvent.item_name,
      project_id: lastEvent.project_id,
      project_name: lastEvent.project_name,
      client_id: lastEvent.client_id,
      client_name: lastEvent.client_name,
      location_id: lastEvent.location_id,
      location_name: lastEvent.location_name,
      issue: lastEvent.issue,
      comment: lastEvent.comment,
      billable: lastEvent.billable
    } : null);

    db.run(`INSERT INTO activity_events 
      (day_session_id, timestamp, event_type, item_id, item_name, project_id, project_name, client_id, client_name, location_id, location_name, issue, comment, billable)
      VALUES (?, ?, 'reopen_day', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id, now,
        resumeToItem?.item_id || null,
        resumeToItem?.item_name || null,
        resumeToItem?.project_id || null,
        resumeToItem?.project_name || null,
        resumeToItem?.client_id || null,
        resumeToItem?.client_name || null,
        resumeToItem?.location_id || null,
        resumeToItem?.location_name || null,
        resumeToItem?.issue || null,
        resumeToItem?.comment || null,
        resumeToItem?.billable !== 0 ? 1 : 0
      ]);

    await saveDb();

    return getSessionById(session.id);
  },

  updateEvent: async (employeeId, eventId, data) => {
    const date = getTodayDate();
    const {
      locationId = null,
      locationName = '',
      issue = null,
      comment = null,
      billable = true
    } = data;

    const session = getActiveSession(employeeId, date);
    if (!session) {
      throw new Error('No active session found');
    }

    const event = getEventById(eventId, session.id);
    if (!event) {
      throw new Error('Event not found');
    }

    if (['pause', 'resume', 'end_day'].includes(event.event_type)) {
      throw new Error('Cannot edit this event type');
    }

    db.run(`UPDATE activity_events 
      SET location_id = ?, location_name = ?, issue = ?, comment = ?, billable = ?
      WHERE id = ?`,
      [
        locationId !== undefined ? locationId : event.location_id,
        locationName !== undefined ? locationName : event.location_name,
        issue !== undefined ? issue : event.issue,
        comment !== undefined ? comment : event.comment,
        billable !== undefined ? (billable ? 1 : 0) : event.billable,
        eventId
      ]);

    await saveDb();

    return getSessionById(session.id);
  }
};

function getActiveSession(employeeId, date) {
  const stmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
  stmt.bind([employeeId, date, 'active']);
  const session = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return session;
}

function getClosedSessionByDate(employeeId, date) {
  const stmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
  stmt.bind([employeeId, date, 'closed']);
  const session = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return session;
}

function getSessionByStatus(employeeId, date, status) {
  const stmt = db.prepare('SELECT * FROM day_sessions WHERE employee_id = ? AND date = ? AND status = ?');
  stmt.bind([employeeId, date, status]);
  
  let session = null;
  if (stmt.step()) {
    session = stmt.getAsObject();
  }
  stmt.free();

  if (!session) {
    return { session: null, events: [] };
  }

  const events = getSessionEvents(session.id);
  return { session, events };
}

function getSessionById(sessionId) {
  const stmt = db.prepare('SELECT * FROM day_sessions WHERE id = ?');
  stmt.bind([sessionId]);
  const session = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();

  if (!session) {
    return { session: null, events: [] };
  }

  const events = getSessionEvents(session.id);
  return { session, events };
}

function getSessionEvents(sessionId) {
  const stmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp ASC');
  stmt.bind([sessionId]);
  
  const events = [];
  while (stmt.step()) {
    events.push(stmt.getAsObject());
  }
  stmt.free();
  return events;
}

function getLastEvent(sessionId) {
  const stmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? ORDER BY timestamp DESC LIMIT 1');
  stmt.bind([sessionId]);
  const event = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return event;
}

function getLastWorkEvent(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM activity_events 
    WHERE day_session_id = ? AND event_type NOT IN ('pause', 'resume', 'end_day')
    ORDER BY timestamp DESC LIMIT 1
  `);
  stmt.bind([sessionId]);
  const event = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return event;
}

function getCurrentWorkEvent(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM activity_events 
    WHERE day_session_id = ? AND event_type NOT IN ('pause', 'resume', 'end_day', 'pop')
    ORDER BY timestamp DESC LIMIT 1
  `);
  stmt.bind([sessionId]);
  const event = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return event;
}

function getPushEvents(sessionId) {
  const stmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? AND event_type = ? ORDER BY timestamp DESC');
  stmt.bind([sessionId, 'push']);
  
  const events = [];
  while (stmt.step()) {
    events.push(stmt.getAsObject());
  }
  stmt.free();
  return events;
}

function getStartDayEvent(sessionId) {
  const stmt = db.prepare('SELECT * FROM activity_events WHERE day_session_id = ? AND event_type = ? ORDER BY timestamp ASC LIMIT 1');
  stmt.bind([sessionId, 'start_day']);
  const event = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return event;
}

function getEventById(eventId, sessionId) {
  const stmt = db.prepare('SELECT * FROM activity_events WHERE id = ? AND day_session_id = ?');
  stmt.bind([eventId, sessionId]);
  const event = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return event;
}
