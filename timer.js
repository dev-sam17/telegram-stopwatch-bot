const mysql = require('mysql2/promise');
const moment = require('moment-timezone');

const { dbConfig } = require('./config');

const { status, start, stop, reset, history } = require('./messages');

const pool = mysql.createPool(dbConfig);

async function clearAllData() {
  const p2 = pool.execute('DELETE FROM stopwatch_sessions')
  const p1 = pool.execute('DELETE FROM timers')
  await Promise.all([p1, p2])
}

async function getStatus() {
  const [active] = await pool.query(`SELECT * FROM timers WHERE active = 1`);

  if(active.length > 0) {
    const timerId = active[0].timer_id;

    const [sessions] = await pool.query(`SELECT * FROM stopwatch_sessions WHERE timer_id = ? ORDER BY session_id DESC`, [timerId]);

    const latestSession = sessions[0];

    let message = latestSession.stop_time !== null ? status.paused : status.running;
    let totalDuration;

    sessions.forEach((session, index) => {
      const _index = sessions.length - index - 1
      const { start_time, stop_time } = session;
      const startTime = start_time ? moment(start_time).tz('Asia/Kolkata').format('DD/MM hh:mm A') : 'Not Started';
      const stopTime = stop_time ? moment(stop_time).tz('Asia/Kolkata').format('DD/MM hh:mm A') : 'Not Stopped';
      const totalTime = stop_time != null ? (stop_time.getTime() - start_time.getTime()) / 1000 : 0;
      totalDuration += totalTime;

      message += history.session(_index, startTime, stopTime, totalTime);
    });

    if(latestSession.stop_time !== null) {
      return { message: message, active: active.length, };
    }

    return { message: message, active: active.length };
  }

  return { message: status.notRunning, active: active.length };
}

async function startStopwatch() {
  const [active] = await pool.query(`SELECT * FROM timers WHERE active = 1`);

  if (active.length > 0) {
    const timerId = active[0].timer_id;

    const [session] = await pool.query(`SELECT * FROM stopwatch_sessions WHERE timer_id = ? ORDER BY session_id DESC`, [timerId]);

    const latestSession = session[0];

    if(latestSession.stop_time !== null) {
      await pool.query(`INSERT INTO stopwatch_sessions (timer_id, start_time, status) VALUES (?, NOW(), 'running')`, [timerId]);
      return { message: start.resume, active: active.length };
    }
 
    return { message: start.running, active: active.length };
  }

  const [timerResult] = await pool.query(`INSERT INTO timers ()  VALUES ()`, []);

  const timerId = timerResult.insertId;
  await pool.query(`INSERT INTO stopwatch_sessions (timer_id, start_time, status) VALUES (?, NOW(), 'running')`, [timerId]);

  return { message: start.started, active: active.length };
}

async function stopStopwatch() {
  const [activeSession] = await pool.query(
    `SELECT session_id, timer_id, start_time FROM stopwatch_sessions WHERE status = 'running' ORDER BY session_id DESC LIMIT 1`
  );

  if (activeSession.length === 0) {
    return { message: stop.noActive, activeSession: activeSession.length };
  }

  const { session_id, start_time } = activeSession[0];
  await pool.query(`UPDATE stopwatch_sessions SET stop_time = NOW(), status = 'stopped' WHERE session_id = ?`, [session_id]);

  const [totalResult] = await pool.query(
    `SELECT TIMESTAMPDIFF(SECOND, ?, NOW()) AS duration FROM stopwatch_sessions WHERE session_id = ?`,
    [start_time, session_id]
  );
  const total = totalResult[0].duration;

  return { message: stop.stopped(total), time: total, activeSession: activeSession.length };
}

async function resetStopwatch() {
  const [data] = await pool.query(`UPDATE timers SET active = 0`);

  await stopStopwatch();
  return { message: reset, affectedRows: data.affectedRows };
}

async function getHistory() {
  const [timers] = await pool.query(`SELECT * FROM timers ORDER BY timer_id DESC`);
  let message = history.header;

  for (let timer of timers) {
    message += history.subHeader(timer.timer_id);
    let totalDuration = 0;

    const [sessions] = await pool.query(`SELECT * FROM stopwatch_sessions WHERE timer_id = ? ORDER BY session_id`, [timer.timer_id]);

    sessions.forEach((session, index) => {
      const { start_time, stop_time } = session;
      const startTime = start_time ? moment(start_time).tz('Asia/Kolkata').format('DD/MM hh:mm A') : 'Not Started';
      const stopTime = stop_time ? moment(stop_time).tz('Asia/Kolkata').format('DD/MM hh:mm A') : 'Not Stopped';
      const totalTime = stop_time != null ? (stop_time.getTime() - start_time.getTime()) / 1000 : 0;
      totalDuration += totalTime;

      message += history.session(index, startTime, stopTime, totalTime);
    });

    message += history.total(totalDuration);
  }

  return message;
}

module.exports = {
  getStatus,
  startStopwatch,
  stopStopwatch,
  resetStopwatch,
  getHistory,
  clearAllData
};
