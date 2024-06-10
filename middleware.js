const { Composer } = require('telegraf');

const checkGroupMiddleware = (groupId) => async (ctx, next) => {
    console.log(ctx.chat.id);
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    if (ctx.chat.id === groupId) {
      return next();
    } else {
    //   await ctx.reply('This command is only available in a specific group.');
    }
  } else {
    // await ctx.reply('This command can only be used in groups.');
  }
};

const composer = new Composer();

// Usage: composer.use(checkGroupMiddleware(groupId));

module.exports = {
  checkGroupMiddleware,
  composer
};
