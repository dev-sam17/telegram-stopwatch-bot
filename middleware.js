const { Composer } = require('telegraf');

const checkGroupMiddleware = (groupId) => async (ctx, next) => {
  console.log(ctx.chat.id);
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    if (ctx.chat.id === groupId) {
      return next();
    }
  }
};

const composer = new Composer();

// Usage: composer.use(checkGroupMiddleware(groupId));

module.exports = {
  checkGroupMiddleware,
  composer
};
