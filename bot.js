const { Telegraf } = require('telegraf');
const mysql = require('mysql2/promise');
const moment = require('moment-timezone');
const momentDuration = require('moment');
require('moment-duration-format');

const { telegramBotToken, dbConfig } = require('./config');
const { composer, checkGroupMiddleware } = require('./middleware');

const bot = new Telegraf(telegramBotToken);
const pool = mysql.createPool(dbConfig);
bot.use(composer);

const GROUP_ID = -1002233703209;
const checkGroup = checkGroupMiddleware(GROUP_ID);

console.log('sasd243')
console.log(512333)

bot.command('start', checkGroup, async (ctx) => {
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

bot.command('stop', checkGroup, async (ctx) => {
  const [activeSession] = await pool.query(
    `SELECT session_id, start_time, timer_id FROM stopwatch_sessions WHERE status = 'running' ORDER BY session_id DESC LIMIT 1`
  );
  if (activeSession.length === 0) {
    ctx.reply('No active stopwatch to stop.');
  } else {
    const { session_id, timer_id, start_time } = activeSession[0];
    await pool.query(`UPDATE stopwatch_sessions SET stop_time = NOW(), status = 'stopped' WHERE session_id = ?`, [session_id]);

    await pool.query(`UPDATE timers SET isPaused = true WHERE timer_id = ?`, [timer_id]);

    const [totalResult] = await pool.query(
      `SELECT TIMESTAMPDIFF(SECOND, ?, NOW()) AS duration FROM stopwatch_sessions WHERE session_id = ?`,
      [start_time, session_id]
    );
    const total = totalResult[0].duration

    ctx.reply(`Stopwatch stopped!  Time: ${total} seconds`);
  }
});

bot.command('reset', checkGroup, async (ctx) => {
  await pool.query(`UPDATE timers SET end_time = NOW() WHERE end_time IS NULL`);
  await pool.query(`UPDATE stopwatch_sessions SET status = 'reset', stop_time = NOW() WHERE status = 'running'`); 

  ctx.reply('Stopwatch and current session reset!');
});

bot.command('history', checkGroup, async (ctx) => {
  const [timers] = await pool.query(`SELECT * FROM timers ORDER BY timer_id DESC`);
  let message = 'Timer Sessions History:\n\n';
  for (let timer of timers) {
    message += `Timer ${timer.timer_id}:\n`;
    let totalDuration = 0;
    const [sessions] = await pool.query(`SELECT * FROM stopwatch_sessions WHERE timer_id = ? ORDER BY session_id`, [timer.timer_id]);
    sessions.forEach((session, index) => {
      const { start_time, stop_time } = session
      const startTime = start_time ? moment(start_time).tz('Asia/Kolkata').format('DD/MM hh:mm A') : 'Not Started';
      const stopTime = stop_time ? moment(stop_time).tz('Asia/Kolkata').format('DD/MM hh:mm A') : 'Not Stopped';
      const totalTime = stop_time != null ? ((stop_time.getTime() - start_time.getTime()) / 1000) : 0;
      totalDuration += totalTime;
      message += `Session ${index + 1}: \n ${startTime} - ${stopTime} - ${formatSeconds(totalTime)}\n`;
    });

    message += `Total Duration: \n ${formatSeconds(totalDuration)} \n\n`;
  }
  ctx.reply(message);
});


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

bot.launch();
console.log('Bot running...');