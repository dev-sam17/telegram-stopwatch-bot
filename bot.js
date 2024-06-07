const { Telegraf } = require('telegraf');
const mysql = require('mysql2/promise');
const { telegramBotToken, dbConfig } = require('./config');

const bot = new Telegraf(telegramBotToken);
const pool = mysql.createPool(dbConfig);

bot.command('start', async (ctx) => {
  const [active] = await pool.query(`SELECT * FROM timers WHERE end_time IS NULL AND isPaused = false`);
  const [paused] = await pool.query(`SELECT * FROM timers WHERE end_time IS NULL AND isPaused = true`);
  if (active.length > 0) {
    ctx.reply('A stopwatch is already running.');
  } else if (paused.length > 0) {
    const timerId = paused[0].timer_id;
    await pool.query(`INSERT INTO stopwatch_sessions (timer_id, start_time, status) VALUES (?, NOW(), 'running')`, [timerId]);
    await pool.query(`UPDATE timers SET isPaused = false WHERE timer_id = ?`, [timerId])
    ctx.reply('Stopwatch resumed');
  }
  else {
    const [timerResult] = await pool.query(`INSERT INTO timers (start_time) VALUES (NOW())`);
    const timerId = timerResult.insertId;
    await pool.query(`INSERT INTO stopwatch_sessions (timer_id, start_time, status) VALUES (?, NOW(), 'running')`, [timerId]);
    ctx.reply('Stopwatch started!');
  }
});

bot.command('stop', async (ctx) => {
  const [activeSession] = await pool.query(
    `SELECT session_id, start_time, timer_id FROM stopwatch_sessions WHERE status = 'running' ORDER BY session_id DESC LIMIT 1`
  );
  if (activeSession.length === 0) {
    ctx.reply('No active stopwatch to stop.');
  } else {
    const { session_id, timer_id } = activeSession[0];
    await pool.query(`UPDATE stopwatch_sessions SET stop_time = NOW(), status = 'stopped' WHERE session_id = ?`, [session_id]);

    await pool.query(`UPDATE timers SET isPaused = true WHERE timer_id = ?`, [timer_id]);

    const [totalResult] = await pool.query(
      `SELECT TIMESTAMPDIFF(SECOND, ?, NOW()) AS duration FROM timers WHERE timer_id = ?`,
      [timer_id]
    );
    const total = totalResult[0].duration
    // await pool.query(`UPDATE stopwatch_sessions SET total_time = ? WHERE session_id = ?`, [total, session_id]);
    ctx.reply(`Stopwatch stopped!  Time: ${total} seconds`);
  }
});

bot.command('reset', async (ctx) => {
  await pool.query(`UPDATE timers SET end_time = NOW() WHERE end_time IS NULL`); // Correctly end the current timer
  await pool.query(`UPDATE stopwatch_sessions SET status = 'reset', stop_time = NOW(), WHERE status = 'running'`); // Correctly reset running sessions
  ctx.reply('Stopwatch and current session reset!');
});

bot.command('history', async (ctx) => {
  const [timers] = await pool.query(`SELECT * FROM timers ORDER BY timer_id DESC`);
  let message = 'Timer Sessions History:\n\n';
  for (let timer of timers) {
    message += `Timer ${timer.timer_id}:\n`;
    const totalDuration = (timer.end_time.getTime() - timer.start_time.getTime()) / 1000;
    message += `Total duration: ${totalDuration} \n`
    const [sessions] = await pool.query(`SELECT * FROM stopwatch_sessions WHERE timer_id = ? ORDER BY session_id`, [timer.timer_id]);
    sessions.forEach((session, index) => {
      const { start_time, stop_time } = session
      const startTime = start_time ? start_time.toISOString().replace('T', ' ').substring(0, 19) : 'Not Started';
      const stopTime = stop_time ? stop_time.toISOString().replace('T', ' ').substring(0, 19) : 'Not Stopped';
      const totalTime = stop_time != null ? ((stop_time.getTime() - start_time.getTime()) / 1000) : 0;
      const hours = Math.floor(totalTime / 3600);
      const minutes = Math.floor((totalTime % 3600) / 60);
      const seconds = totalTime % 60;
      message += `  Session ${index + 1}: ${startTime} - ${stopTime} - ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}\n`;
    });
  }
  ctx.reply(message);
});

bot.launch();