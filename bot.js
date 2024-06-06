const { Telegraf, session } = require('telegraf');
const mysql = require('mysql2/promise');
const { telegramBotToken, dbConfig } = require('./config');

console.log(telegramBotToken)
console.log(dbConfig)

const bot = new Telegraf(telegramBotToken);

const pool = mysql.createPool(dbConfig);

async function getRunningSession(userId) {
    const [latestSessionRow] = await pool.execute(
        'SELECT * FROM timer_sessions WHERE user_id = ? AND command = ? AND duration = 0 ORDER BY start_time DESC LIMIT 1',
        [userId, 'start']
    )
    return { isRunning: latestSessionRow.length > 0 ? true : false, session: latestSessionRow }
}

async function getPausedSession(userId) {
    const [existingSessionRows] = await pool.execute(
        'SELECT * FROM timer_sessions WHERE user_id = ? AND command = ?',
        [userId, 'stop']
    );

    return { isPaused: existingSessionRows.length > 0 ? true : false, session: existingSessionRows }
}

bot.start(async (ctx) => {
    const userId = ctx.from.id;

    let currentSession = await getRunningSession(userId);

    if (currentSession.isRunning) {
        return ctx.reply('Timer already running.');
    }

    currentSession = await getPausedSession(userId);

    if (currentSession.isPaused) {
        const id = currentSession.session[0].id;

        await pool.execute(
            'UPDATE timer_sessions SET command = ? WHERE id = ?',
            ['start', id]
        );

        return ctx.reply('Stopwatch resumed.');
    }

    await pool.execute(
        'INSERT INTO timer_sessions (user_id, command) VALUES (?, ?)',
        [userId, 'start']
    );
    ctx.reply('Stopwatch started.');

});

bot.command('stop', async (ctx) => {
    const userId = ctx.from.id;

    let currentSession = await getRunningSession(userId);

    if (currentSession.isRunning) {
        const id = currentSession.session[0].id;
        const startTime = currentSession.session[0].start_time;
        const duration = Math.floor((Date.now() - new Date(startTime)) / 1000);
        await pool.execute(
            'UPDATE timer_sessions SET command = ? WHERE id = ?',
            ['stop', id]
        );
        return ctx.reply(`Stopwatch stopped. Elapsed time: ${formatTime(duration)}`);
    }

    currentSession = await getPausedSession(userId);

    if (currentSession.isPaused) {
        return ctx.reply('Stopwatch is already paused');
    }

    ctx.reply('No stopwatch running');
});

bot.command('reset', async (ctx) => {
    const userId = ctx.from.id;

    let duration;

    let currentSession = await getRunningSession(userId);

    if (currentSession.isRunning) {
        const id = currentSession.session[0].id;
        const startTime = currentSession.session[0].start_time;
        duration = Math.floor((Date.now() - new Date(startTime)) / 1000);

        await pool.execute(
            'UPDATE timer_sessions SET command = ?, duration = ? WHERE id = ?',
            ['reset', duration, id]
        );
        return ctx.reply(`Stopwatch reset. Elapsed Session Time: ${formatTime(duration)}`);
    }

    currentSession = await getPausedSession(userId);

    if (currentSession.isPaused) {
        const id = currentSession.session[0].id;
        const startTime = currentSession.session[0].start_time;
        duration = Math.floor((Date.now() - new Date(startTime)) / 1000);

        await pool.execute(
            'UPDATE timer_sessions SET command = ?, duration = ? WHERE id = ?',
            ['reset', duration, id]
        );
        return ctx.reply(`Stopwatch reset. Elapsed Session Time: ${formatTime(duration)} `);
    }
});

bot.command('history', async (ctx) => {
    const userId = ctx.from.id;

    const [rows] = await pool.execute(
        'SELECT * FROM timer_sessions WHERE user_id = ? ORDER BY start_time ASC',
        [userId]
    );

    if (rows.length === 0) {
        ctx.reply('No history found.');
        return;
    }

    const [totalRows] = await pool.execute(
        'SELECT SUM(duration) AS total_duration FROM timer_sessions WHERE user_id = ?',
        [userId]
    );
    const totalDuration = totalRows[0].total_duration || 0;

    let historyMessage = `Total Time: ${formatTime(totalDuration)} seconds\n`;

    rows.forEach((row, index) => {
        historyMessage += `Session ${index + 1}: ${row.duration > 0 ? formatTime(row.duration) : "Running"} \n`;
    });

    ctx.reply(historyMessage);
});

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const hoursDisplay = hours > 0 ? hours + 'h ' : '';
    const minutesDisplay = minutes > 0 ? minutes + 'm ' : '';
    const secondsDisplay = remainingSeconds + 's';

    return hoursDisplay + minutesDisplay + secondsDisplay;
}

bot.launch();
console.log('Bot is running...');
