// eslint-disable-next-line object-curly-newline
const { Telegraf, session, Stage, Telegram } = require('telegraf');
require('dotenv').config();

const { logger } = require('./middleware');
const { setCommands } = require('./helper/commandhooks');
const croner = require('./helper/cron');
const { ScenesLists } = require('./scenes');
const home = require('./scenes/home');
const messageTemp = require('./message.json');

// instance telegram service
const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegram(process.env.BOT_TOKEN);

// Some Middleware
bot.use(session({ makeKey: (ctx) => `${ctx.from.id}:${ctx.chat.id}` }));
bot.use(logger);
bot.use(async (ctx, next) => {
  /* eslint-disable no-underscore-dangle */
  // const sceneName =
  //   ctx.session.__scenes !== undefined ? ctx.session.__scenes.current : 'root';
  // await setCommands(ctx.telegram, sceneName);
  if (ctx.session.__scenes != null) {
    if (ctx.session.__scenes.current != null) {
      await setCommands(ctx.telegram, ctx.session.__scenes.current);
    } else {
      await setCommands(ctx.telegram, 'root');
    }
  }
  next();
});

bot.catch((err, ctx) => {
  ctx.reply(`Ooops, encountered an error for ${err.stack}`);
});

// instance stage
const stage = new Stage(ScenesLists);

// enter stage command initial
bot.use(stage.middleware());

// default
bot.start(async (ctx) => {
  await setCommands(ctx.telegram, 'root');
  await ctx.reply(messageTemp.welcomeLogin);
});
bot.help((ctx) => ctx.reply(messageTemp.welcomeLogin));

// Login func
require('./scenes/login')(bot);

// scheduled process
croner(telegram);

bot.launch();
