const { Telegraf, Scenes, session } = require("telegraf");
const logger = require("./utils/logger");

const startCommand = require("./commands/start");
const registrationCommand = require("./commands/registration");
const ruporCommand = require("./commands/rupor");
const extendCommand = require("./commands/extend");
const payCommand = require("./commands/pay");
const migrateCommand = require("./commands/migrate");
const restartCommand = require("./commands/restart");
const infoCommand = require("./commands/info");
const instructionsCommand = require("./commands/instructions");
const referralCommand = require("./commands/referral");
const statusCommand = require("./commands/status");
const { CMD } = require("./constants");
const {
  registrationScene,
} = require("./commands/registration/registrationScene");
const { extendScene } = require("./commands/extend/extendScene");
const { ruporScene } = require("./commands/rupor/ruporScene");
const { migrateScene } = require("./commands/migrate/migrateScene");
const { payScene } = require("./commands/pay/payScene");

const {
  instructionsCallbackQuery,
} = require("./commands/instructions/callbackQuery");
const { runBackupSheduller } = require("./utils/shedulers/backup");
const {
  runPaymentNotificationSheduler,
} = require("./utils/shedulers/paymentNotification");
const {
  runSyncActiveUserSheduler,
} = require("./utils/shedulers/synsActiveUser");
const {
  runToogleUserStatusSheduler,
} = require("./utils/shedulers/toogleUserStatus");
const {
  extendOnErrorCallbackQuery,
} = require("./commands/extend/callbackQuery");

const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 20000 });

const setupBot = () => {
  runBackupSheduller(bot);
  runPaymentNotificationSheduler(bot);
  runToogleUserStatusSheduler();
  runSyncActiveUserSheduler();

  const stage = new Scenes.Stage([
    registrationScene,
    extendScene,
    ruporScene,
    migrateScene,
    payScene,
  ]);
  bot.use(session());
  bot.use(stage.middleware());

  bot.start(startCommand);
  bot.command(CMD.info, infoCommand);
  bot.command(CMD.referral, referralCommand);
  bot.command(CMD.status, statusCommand);
  bot.command(CMD.extend, extendCommand);
  bot.command(CMD.restart, restartCommand);
  bot.command(CMD.migrate, migrateCommand);
  bot.command(CMD.instructions, instructionsCommand);
  bot.command(CMD.registration, registrationCommand);
  bot.command(CMD.rupor, ruporCommand);
  bot.command(CMD.pay, payCommand);
  bot.command(CMD.help, (ctx) =>
    ctx.reply(
      `Если у вас возникли вопросы, пишите разработчику ${process.env.DEVELOPER_CONTACT}`,
    ),
  );

  bot.catch((err, ctx) => {
    logger.error(err, ctx.message.from.id);
    ctx.sendMessage("Произошла ошибка при выполнении операции 👉 /help");
  });

  bot.on("callback_query", (ctx) => {
    const queryData = ctx?.update?.callback_query?.data;

    instructionsCallbackQuery(ctx, queryData);
    extendOnErrorCallbackQuery(ctx, queryData);
  });

  return bot;
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = setupBot;
