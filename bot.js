const { Telegraf, session } = require('telegraf');
const mysql = require('mysql2/promise');
const { telegramBotToken, dbConfig } = require('./config');

const bot = new Telegraf(telegramBotToken);
const pool = mysql.createPool(dbConfig);

// Command to start the stopwatch
bot.command('start', async (ctx) => {
  try {
    // Insert a new record with start_time as current timestamp
    const [result] = await pool.execute(
      `INSERT INTO timer_sessions (start_time) VALUES (CURRENT_TIMESTAMP)`
    );

    const insertedId = result.insertId;
    ctx.reply(`Stopwatch started!`);
  } catch (error) {
    console.error('Error starting stopwatch:', error);
    ctx.reply('Failed to start the stopwatch.');
  }
});

// Command to stop the stopwatch
bot.command('stop', async (ctx) => {
  try {
    // Find the latest session with no end_time set
    const [rows] = await pool.execute(
      `SELECT id, start_time FROM timer_sessions WHERE end_time IS NULL ORDER BY id DESC LIMIT 1`
    );

    if (rows.length === 0) {
      ctx.reply('No active stopwatch session found.');
      return;
    }

    const sessionId = rows[0].id;
    const startTime = new Date(rows[0].start_time);

    // Update the end_time for this session
    await pool.execute(
      `UPDATE timer_sessions SET end_time = CURRENT_TIMESTAMP WHERE id = ?`,
      [sessionId]
    );

    const [updatedRows] = await pool.execute(
      `SELECT end_time FROM timer_sessions WHERE id = ?`,
      [sessionId]
    );

    const endTime = new Date(updatedRows[0].end_time);
    const elapsedTime = endTime - startTime;

    const elapsedSeconds = Math.floor(elapsedTime / 1000);
    const seconds = elapsedSeconds % 60;
    const minutes = Math.floor(elapsedSeconds / 60) % 60;
    const hours = Math.floor(elapsedSeconds / 3600);

    ctx.reply(`Stopwatch stopped! Elapsed time: ${hours}h ${minutes}m ${seconds}s`);
  } catch (error) {
    console.error('Error stopping stopwatch:', error);
    ctx.reply('Failed to stop the stopwatch.');
  }
});

bot.launch();

console.log('Bot started...');
