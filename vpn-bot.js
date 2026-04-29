const { Telegraf, Scenes, session, Markup } = require("telegraf");
const logger = require("./utils/logger");

const startCommand = require("./commands/start");
const registrationCommand = require("./commands/registration");
const bindEmailCommand = require("./commands/bindEmail");
const ruporCommand = require("./commands/rupor");
const extendCommand = require("./commands/extend");
const payCommand = require("./commands/pay");
const migrateToSlaveCommand = require("./commands/migrateToSlave");
const checkUserCommand = require("./commands/checkUser");
const infoCommand = require("./commands/info");
const helpCommand = require("./commands/help");
const instructionsCommand = require("./commands/instructions");
const referralCommand = require("./commands/referral");
const statusCommand = require("./commands/status");
const { CMD, USERS_TEXT } = require("./constants");
const {
  registrationScene,
} = require("./commands/registration/registrationScene");
const { extendScene } = require("./commands/extend/extendScene");
const { ruporScene } = require("./commands/rupor/ruporScene");
const {
  migrateToSlaveScene,
} = require("./commands/migrateToSlave/migrateToSlaveScene");
const { checkUserScene } = require("./commands/checkUser/checkUserScene");
const { payScene } = require("./commands/pay/payScene");
const { bindEmailScene } = require("./commands/bindEmail/bindEmailScene");

const {
  instructionsCallbackQuery,
} = require("./commands/instructions/callbackQuery");
const { runBackupSheduller } = require("./utils/shedulers/backup");
const {
  runPaymentNotificationSheduler,
} = require("./utils/shedulers/paymentNotification");
const {
  runDailyPaymentsReportSheduler,
} = require("./utils/shedulers/dailyPaymentsReport");
const {
  runToogleUserStatusSheduler,
} = require("./utils/shedulers/toogleUserStatus");
const {
  extendOnErrorCallbackQuery,
} = require("./commands/extend/callbackQuery");
const { hideButtons, getMainMenu } = require("./components/buttons");
const { getUserPersonalDataFromContext } = require("./utils/common");

const MAIN_MENU_HINT_TEXT =
  "Для оплаты VPN выберите «Оплату», а для технической поддержки — «Помощь».";

const mainMenuHintKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(USERS_TEXT.pay, CMD.pay),
    Markup.button.callback(USERS_TEXT.help, CMD.help),
  ],
]).resize();

const isOutsideScene = (ctx) => !ctx.scene?.current;

const replyMainMenuHintIfIdle = async (ctx) => {
  if (!isOutsideScene(ctx)) {
    return;
  }
  await ctx.reply(MAIN_MENU_HINT_TEXT, mainMenuHintKeyboard);
};

const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 20000 });

const setupBot = () => {
  // ежедневное создание бекапов
  runBackupSheduller(bot);
  // ежедневное напоминание об оплате за 2 дня
  runPaymentNotificationSheduler(bot);
  // ежедневный отчёт по оплатам за прошедшие сутки (админу)
  runDailyPaymentsReportSheduler(bot);
  // выставление признака активный/неактивный пользователь
  runToogleUserStatusSheduler("0 * * * *");

  const stage = new Scenes.Stage([
    registrationScene,
    extendScene,
    ruporScene,
    migrateToSlaveScene,
    checkUserScene,
    payScene,
    bindEmailScene,
  ]);

  bot.use(session());
  bot.use(stage.middleware());

  bot.start(startCommand);

  bot.action(CMD.info, infoCommand);
  bot.action(CMD.referral, referralCommand);
  bot.action(CMD.status, statusCommand);
  bot.action(CMD.extend, extendCommand);
  bot.action(CMD.migrateToSlave, migrateToSlaveCommand);
  bot.action(CMD.checkUser, checkUserCommand);
  bot.action(CMD.instructions, instructionsCommand);
  bot.action(CMD.registration, registrationCommand);
  bot.action(CMD.bindEmail, bindEmailCommand);
  bot.action(CMD.rupor, ruporCommand);
  bot.action(CMD.pay, payCommand);
  bot.action(CMD.help, helpCommand);

  bot.catch(async (err, ctx) => {
    const { id: chatId } = getUserPersonalDataFromContext(ctx);
    logger.error(err, chatId);
    await ctx.sendMessage("Произошла ошибка, мы разберёмся и поправим 👌");
    await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
    await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
  });

  bot.on("callback_query", (ctx) => {
    const queryData = ctx?.update?.callback_query?.data;

    instructionsCallbackQuery(ctx, queryData);
    extendOnErrorCallbackQuery(ctx, queryData);
  });

  bot.on("text", async (ctx) => {
    if (!isOutsideScene(ctx)) {
      return;
    }

    const text = ctx.message?.text ?? "";
    if (text.startsWith("/")) {
      return;
    }

    const isBotCommand = ctx.message?.entities?.some(
      (entity) => entity.type === "bot_command",
    );
    if (isBotCommand) {
      return;
    }

    await replyMainMenuHintIfIdle(ctx);
  });

  bot.on(
    ["document", "photo", "video", "audio", "voice", "animation"],
    async (ctx) => {
      await replyMainMenuHintIfIdle(ctx);
    },
  );

  return bot;
};

// слушаем переход на главную,чтобы скрыть кнопку внизу
bot.hears(USERS_TEXT.goToMain, async (ctx) => {
  await ctx.reply(USERS_TEXT.mainMenu, hideButtons);
  await ctx.reply(USERS_TEXT.selectActions, await getMainMenu(ctx));
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = setupBot;
