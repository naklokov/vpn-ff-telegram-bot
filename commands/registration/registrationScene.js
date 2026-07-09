const { Scenes } = require("telegraf");
const logger = require("../../utils/logger");

const {
  SCENE_IDS,
  EMAIL_REGEXP,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  USERS_TEXT,
  DEVELOPER_CONTACT,
} = require("../../constants");
const { exitButtonScene } = require("../../components/buttons");
const { exitToMenu } = require("../../utils/scene-ui");
const {
  getUserPersonalDataFromContext,
  generatePassword,
} = require("../../utils/common");
const { usersConnector } = require("../../server");
const { getSubscriptionUrlByPhone } = require("../../utils/remnawave");
const { withClientWaiting } = require("../../utils/client-waiting");
const { normalizeRuPhoneToMsisdn } = require("../../utils/phone");

const registrationScene = new Scenes.WizardScene(
  SCENE_IDS.REGISTRATION,
  async (ctx) => {
    const { name, id } = getUserPersonalDataFromContext(ctx);

    // инициализация формы пользователя
    ctx.wizard.state.user = {};

    // сохранение пользовательских данных
    ctx.wizard.state.user.name = name;
    ctx.wizard.state.user.chatId = id;

    ctx.reply(
      "Введите ваш номер телефон в формате 79998887766",
      exitButtonScene,
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const userPhone = normalizeRuPhoneToMsisdn(ctx.message?.text);
    if (!userPhone || !PHONE_REGEXP.test(userPhone)) {
      ctx.reply(
        "Номер введён некорректно. Введите мобильный номер РФ в формате 79998887766",
        exitButtonScene,
      );
      return;
    }

    if (!ctx.wizard.state?.user) {
      await exitToMenu(ctx);
      return;
    }

    ctx.wizard.state.user.phone = userPhone;

    ctx.reply(
      "Введите вашу электронную почту в формате: test@mail.ru",
      exitButtonScene,
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!EMAIL_REGEXP.test(ctx?.message?.text)) {
      ctx.reply(
        "Введите корректную почту в формате: test@mail.ru",
        exitButtonScene,
      );
      return;
    }

    if (!ctx.wizard.state?.user) {
      await exitToMenu(ctx);
      return;
    }

    ctx.wizard.state.user.email = ctx.message?.text;
    const { chatId, phone } = ctx.wizard.state.user;

    let existedUserByPhone = null;
    let existedUserByChatId = null;

    try {
      existedUserByPhone = await usersConnector.getUserByPhone(phone);
      existedUserByChatId = await usersConnector.getUserByChatId(chatId);
    } catch (error) {
      logger.error("Ошибка проверки пользователя при регистрации", error);
      await ctx.reply(
        `Не удалось проверить данные. Попробуйте позже или напишите ${DEVELOPER_CONTACT}`,
      );
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    // валидация наличия пользователя в БД
    if (existedUserByChatId && chatId !== ADMIN_CHAT_ID) {
      await ctx.reply("Данный пользователь уже зарегистрирован");
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    if (existedUserByPhone) {
      await ctx.reply(`Пользователь с номером ${phone} уже зарегистрирован`);
      await exitToMenu(ctx, { keepLastBotMessages: 1 });
      return;
    }

    // проверяем наличие реферральной ссылки у пользователя
    const referralUserLogin = ctx.session.referralUserLogin;
    if (referralUserLogin) {
      ctx.wizard.state.user.referralUserLogin = referralUserLogin;
    }

    const password = generatePassword();
    const serverPrefix = process?.env?.NEW_USER_SERVER_PREFIX ?? "";
    ctx.wizard.state.user.password = password;
    ctx.wizard.state.user.serverPrefix = serverPrefix;

    let keepLastBotMessages = 0;

    try {
      const subscriptionUrl = await withClientWaiting(
        ctx,
        "⏳ Регистрирую вас в системе и подготавливаю доступ...",
        async () => {
          await usersConnector.addUser(ctx.wizard.state.user);
          return getSubscriptionUrlByPhone(phone);
        },
      );
      await ctx.reply("Вы успешно зарегистрированы!\n\n");
      await ctx.reply(
        "Настройте ВПН по инструкции внутри вашей ссылки с подпиской 👇👇👇\n" +
          `${subscriptionUrl}`,
      );
      keepLastBotMessages = 3;
      logger.info(
        `Пользователь успешно добавлен ${ctx.wizard.state.user.phone}`,
      );
    } catch (error) {
      await usersConnector
        .deleteUser(ctx.wizard.state.user.chatId)
        .catch(() => {});
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Не удалось завершить регистрацию. Попробуйте позже.";
      await ctx.reply(
        `${message}\n\nЕсли проблема повторится, пишите ${DEVELOPER_CONTACT}`,
      );
      keepLastBotMessages = 1;
      logger.error(error);
    } finally {
      await exitToMenu(ctx, { keepLastBotMessages });
    }
  },
);

registrationScene.hears(USERS_TEXT.exitScene, async (ctx) => {
  await exitToMenu(ctx);
});

module.exports = { registrationScene };
