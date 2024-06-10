const { Telegraf } = require('telegraf');
const { composer, checkGroupMiddleware } = require('./middleware');

const { telegramBotToken } = require('./config')

const { startStopwatch, stopStopwatch, resetStopwatch, getHistory } = require('./timer');

const bot = new Telegraf(telegramBotToken);
bot.use(composer);

const GROUP_ID = -1002233703209;
const checkGroup = checkGroupMiddleware(GROUP_ID);

bot.command('start', checkGroup, async (ctx) => {
  const response = await startStopwatch();
  ctx.reply(response.message);
});

bot.command('stop', checkGroup, async (ctx) => {
  const response = await stopStopwatch();
  ctx.reply(response.message);
});

bot.command('reset', checkGroup, async (ctx) => {
  const response = await resetStopwatch();
  ctx.reply(response.message);
});

bot.command('history', checkGroup, async (ctx) => {
  ctx.reply(await getHistory());
});

bot.launch();
console.log('Bot running...');
