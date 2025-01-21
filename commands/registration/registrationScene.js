const { Scenes, Markup } = require("telegraf");
const logger = require("../../utils/logger");

const {
  SCENE_IDS,
  EMAIL_REGEXP,
  PHONE_REGEXP,
  CMD_TEXT,
  ADMIN_CHAT_ID,
} = require("../../constants");
const { registrationExitButton } = require("../../components/buttons");
const { registrationExitCommand } = require("../../components/exit");
const { getSuccessReply } = require("./constants");
const {
  getUserPersonalDataFromContext,
  generatePassword,
} = require("../../utils/common");
const { addVlessUser } = require("../../utils/vless");
const { usersConnector } = require("../../db");
const { error } = require("console");

const registrationScene = new Scenes.WizardScene(
  SCENE_IDS.REGISTRATION,
  async (ctx) => {
    const { name, id } = getUserPersonalDataFromContext(ctx);

    // инициализация формы пользователя
    ctx.wizard.state.user = {};

    // сохранение пользовательских данных
    ctx.wizard.state.user.name = name;
    ctx.wizard.state.user.chatId = id;

    ctx.reply("Введите ваш номер телефон в формате 79998887766", {
      ...registrationExitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!PHONE_REGEXP.test(ctx?.message?.text)) {
      ctx.reply(
        "Номер введён некорректно. Введите номер в формате 79998887766",
        { ...registrationExitButton },
      );
      return;
    }

    if (!ctx.wizard.state?.user) {
      await registrationExitCommand(ctx);
      await ctx.scene.leave();
      return;
    }

    ctx.wizard.state.user.phone = ctx.message?.text;

    ctx.reply("Введите вашу электронную почту в формате: test@mail.ru", {
      ...registrationExitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!EMAIL_REGEXP.test(ctx?.message?.text)) {
      ctx.reply("Введите корректную почту в формате: test@mail.ru", {
        ...registrationExitButton,
      });
      return;
    }

    if (!ctx.wizard.state?.user) {
      await registrationExitCommand(ctx);
      await ctx.scene.leave();
      return;
    }

    ctx.wizard.state.user.email = ctx.message?.text;
    const { chatId, phone } = ctx.wizard.state.user;

    // Миграция на новый ВПН
    ctx.wizard.state.user.isVless = true;

    const existedUserByPhone = await usersConnector.getUserByPhone(phone);
    const existedUserByChatId = await usersConnector.getUserByChatId(chatId);

    // если пользователь старый то нужно обновить его данные в системе
    if (existedUserByPhone && !existedUserByChatId) {
      await usersConnector.updateUserByPhone(phone, ctx.wizard.state.user);
      await ctx.reply("Ваши данные регистрации обновлены");
      registrationExitCommand(ctx);
      return;
    }

    // валидация наличия пользователя в БД
    if (existedUserByChatId && !chatId === ADMIN_CHAT_ID) {
      await ctx.reply("Данный пользователь уже зарегистрирован");
      await registrationExitCommand(ctx);
      await ctx.scene.leave();
      return;
    }

    if (existedUserByPhone && !chatId === ADMIN_CHAT_ID) {
      await ctx.reply(`Пользователь с номером ${phone} уже зарегистрирован`);
      await registrationExitCommand(ctx);
      await ctx.scene.leave();
      return;
    }

    // проверяем наличие реферральной ссылки у пользователя
    const referralUserLogin = ctx.session.referralUserLogin;
    if (referralUserLogin) {
      ctx.wizard.state.user.referralUserLogin = referralUserLogin;
    }

    const password = generatePassword();
    ctx.wizard.state.user.password = password;

    try {
      await addVlessUser({ chatId, phone });
    } catch (error) {
      logger.error("Произошла ошибка при добавление на vless сервер", error);
    }

    try {
      // добавление в БД
      await usersConnector.addUser(ctx.wizard.state.user);

      await ctx.reply(getSuccessReply(), {
        parse_mode: "MarkdownV2",
      });
      logger.info(
        `Пользователь успешно добавлен ${ctx.wizard.state.user.phone}`,
      );
    } catch (error) {
      await usersConnector.deleteUser(ctx.wizard.state.user.chatId);
      logger.error(error);
      throw Error(error);
    } finally {
      registrationExitCommand(ctx);
      ctx.scene.leave();
    }
  },
);

registrationScene.hears(CMD_TEXT.registrationExit, (ctx) => {
  ctx.reply("Вы на главной странице", Markup.removeKeyboard(true));
  ctx.scene.leave();
});

module.exports = { registrationScene };
