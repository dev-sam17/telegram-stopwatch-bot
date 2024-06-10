const mysql = require('mysql2/promise');
const moment = require('moment-timezone');
const momentDuration = require('moment');
require('moment-duration-format');
const { dbConfig} = require('./config');
const { message } = require('telegraf/filters');

const pool = mysql.createPool(dbConfig);

async function clearAllData() {
    const p2=pool.execute('DELETE FROM stopwatch_sessions')
    const p1= pool.execute('DELETE FROM timers')
     await Promise.all([p1,p2])
}

async function startStopwatch() {
  const [active] = await pool.query(`SELECT * FROM timers WHERE end_time IS NULL AND isPaused = 0`);
  const [paused] = await pool.query(`SELECT * FROM timers WHERE end_time IS NULL AND isPaused = 1`);

  console.log('DEGUB START', {active, paused})
  if (active.length > 0) {
    return { message: 'A stopwatch is already running.', active: active.length, paused: paused.length };
  } 
  
  if (paused.length > 0) {
    const timerId = paused[0].timer_id;
    await pool.query(`INSERT INTO stopwatch_sessions (timer_id, start_time, status) VALUES (?, NOW(), 'running')`, [timerId]);
    await pool.query(`UPDATE timers SET isPaused = 0 WHERE timer_id = ?`, [timerId]);
    return { message: 'Stopwatch resumed.', active: active.length, paused: paused.length };
  } 

    const [timerResult] = await pool.query(`INSERT INTO timers (start_time, isPaused)  VALUES (NOW(), 0)`, []);
    const timerId = timerResult.insertId;
    await pool.query(`INSERT INTO stopwatch_sessions (timer_id, start_time, status) VALUES (?, NOW(), 'running')`, [timerId]);

    const [rows]=await pool.execute('SELECT * FROM timers')
    console.log('AFTER INSERTING', rows)
    return { message: 'Stopwatch started!', active: active.length, paused: paused.length };
  
}

async function stopStopwatch() {
  const [activeSession] = await pool.query(
    `SELECT session_id, timer_id, start_time FROM stopwatch_sessions WHERE status = 'running' ORDER BY session_id DESC LIMIT 1`
  );

  if (activeSession.length === 0) {
    return {message:'No active stopwatch to stop.', activeSession : activeSession.length};
  }
  
    const { session_id, timer_id, start_time } = activeSession[0];
    await pool.query(`UPDATE stopwatch_sessions SET stop_time = NOW(), status = 'stopped' WHERE session_id = ?`, [session_id]);
    await pool.query(`UPDATE timers SET isPaused = 1 WHERE timer_id = ?`, [timer_id]);

    const [totalResult] = await pool.query(
      `SELECT TIMESTAMPDIFF(SECOND, ?, NOW()) AS duration FROM stopwatch_sessions WHERE session_id = ?`,
      [start_time, session_id]
    );
    const total = totalResult[0].duration;

    return {message:`Stopwatch stopped!  Time: ${formatSeconds(total)} seconds`, time: total, activeSession: activeSession.length };
  
}

async function resetStopwatch() {
  const [data] = await pool.query(`UPDATE timers SET end_time = NOW() WHERE end_time IS NULL`);

  await stopStopwatch();
//   await pool.query(`UPDATE stopwatch_sessions SET status = 'reset', stop_time = NOW() WHERE status = 'running'`);
  return { message: 'Stopwatch and current session reset!', affectedRows: data.affectedRows};
}

async function getHistory() {
  const [timers] = await pool.query(`SELECT * FROM timers ORDER BY timer_id DESC`);
  let message = 'Timer Sessions History:\n\n';

  for (let timer of timers) {
    message += `Timer ${timer.timer_id}:\n`;
    let totalDuration = 0;

    const [sessions] = await pool.query(`SELECT * FROM stopwatch_sessions WHERE timer_id = ? ORDER BY session_id`, [timer.timer_id]);

    sessions.forEach((session, index) => {
      const { start_time, stop_time } = session;
      const startTime = start_time ? moment(start_time).tz('Asia/Kolkata').format('DD/MM hh:mm A') : 'Not Started';
      const stopTime = stop_time ? moment(stop_time).tz('Asia/Kolkata').format('DD/MM hh:mm A') : 'Not Stopped';
      const totalTime = stop_time != null ? (stop_time.getTime() - start_time.getTime()) / 1000 : 0;
      totalDuration += totalTime;

      message += `Session ${index + 1}: \n ${startTime} - ${stopTime} - ${formatSeconds(totalTime)}\n`;
    });

    message += `Total Duration: \n ${formatSeconds(totalDuration)} \n\n`;
  }

  return message;
}

function formatSeconds(seconds) {
  const duration = momentDuration.duration(seconds, 'seconds');

  const hours = duration.hours();
  const minutes = duration.minutes();
  const secs = duration.seconds();

  let formatted = '';

  if (hours > 0) {
    formatted += `${hours}h `;
  }

  if (minutes > 0) {
    formatted += `${minutes}m `;
  }

  if (secs > 0 || (hours === 0 && minutes === 0)) {
    formatted += `${secs}s`;
  }

  return formatted.trim();
}

module.exports = {
  startStopwatch,
  stopStopwatch,
  resetStopwatch,
  getHistory,
  clearAllData
};
