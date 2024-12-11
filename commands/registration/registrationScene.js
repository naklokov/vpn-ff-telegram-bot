const { Scenes, Markup } = require("telegraf");
const {
  SCENE_IDS,
  EMAIL_REGEXP,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  CMD_TEXT,
  VLESS_INBOUND_ID,
} = require("../../constants");
const instructionsCommand = require("../instructions");
const { registrationExitButton } = require("../../components/buttons");
const { registrationExitCommand } = require("../../components/exit");
const {
  getUserPersonalDataFromContext,
  generatePassword,
  getExpiredDate,
} = require("../../utils/common");
// const { addUserToSecrets } = require('../../utils/secrets');
const { usersConnector } = require("../../db");
const { addClientToInbound } = require("../../api/vless");

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
    if (!PHONE_REGEXP.test(ctx.message.text)) {
      ctx.reply(
        "Номер введён некорректно. Введите номер в формате 79998887766",
        { ...registrationExitButton },
      );
      return;
    }

    ctx.wizard.state.user.phone = ctx.message.text;

    ctx.reply("Введите вашу электронную почту в формате: test@mail.ru", {
      ...registrationExitButton,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!EMAIL_REGEXP.test(ctx.message.text)) {
      ctx.reply("Введите корректную почту в формате: test@mail.ru", {
        ...registrationExitButton,
      });
      return;
    }
    ctx.wizard.state.user.email = ctx.message.text;
    const { chatId, email, phone } = ctx.wizard.state.user;

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
    if (existedUserByChatId && existedUserByPhone && chatId !== ADMIN_CHAT_ID) {
      await ctx.reply("Данный пользователь уже зарегистрирован");
      registrationExitCommand(ctx);
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
      // добавление в БД
      await usersConnector.addUser(ctx.wizard.state.user);

      const expiryTime = Math.floor(getExpiredDate().getTime());
      await addClientToInbound(VLESS_INBOUND_ID, {
        chatId,
        email,
        id: phone,
        expiryTime,
      });

      await ctx.reply("Вы успешно зарегистрированы!");
      await ctx.reply(
        "Для получения инструкций по подключению напишите @naklokov",
      );
      // await instructionsCommand(ctx);
    } catch (error) {
      await usersConnector.deleteUser(ctx.wizard.state.user.chatId);
      ctx.reply("Произошла ошибка при регистрации, обратитесь к разработчку");
      console.log(
        "Произошла ошибка при регистрации пользователя " +
          ctx.wizard.state.user.phone,
        error,
      );
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
