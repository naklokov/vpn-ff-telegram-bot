const { Scenes, Markup } = require("telegraf");
const {
  SCENE_IDS,
  EMAIL_REGEXP,
  PHONE_REGEXP,
  ADMIN_CHAT_ID,
  CMD_TEXT,
} = require("../../constants");
const instructionsCommand = require("../instructions");
const { registrationExitCommand } = require("../../commands/registrationExit");
const { registrationExitButton } = require("../../components/buttons");
const {
  getUserPersonalDataFromContext,
  generatePassword,
} = require("../../utils/common");
const { addUserToSecrets } = require("../../utils/secrets");
const { usersConnector } = require("../../db");

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
        { ...registrationExitButton }
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

    const existedUserByPhone = await usersConnector.getUserByPhone(
      ctx.wizard.state.user.phone
    );
    const existedUserByChatId = await usersConnector.getUserByChatId(
      ctx.wizard.state.user.chatId
    );

    // если пользователь старый то нужно обновить его данные в системе
    if (existedUserByPhone && !existedUserByChatId) {
      await usersConnector.updateUserByPhone(
        ctx.wizard.state.user.phone,
        ctx.wizard.state.user
      );
      await ctx.reply("Ваши данные регистрации обновлены");
      registrationExitCommand(ctx);
      return;
    }

    // валидация наличия пользователя в БД
    if (
      existedUserByChatId &&
      existedUserByPhone &&
      ctx.wizard.state.user.chatId !== ADMIN_CHAT_ID
    ) {
      await ctx.reply("Данный пользователь уже зарегистрирован");
      registrationExitCommand(ctx);
      return;
    }

    const login = ctx.wizard.state.user.phone;
    const password = generatePassword();
    ctx.wizard.state.user.password = password;

    try {
      // добавление в БД
      await usersConnector.addUser(ctx.wizard.state.user);
      // добавление в файл секретов
      await addUserToSecrets(login, password);

      await ctx.reply(
        `Вы успешно зарегистрированы!\n
логин: ${login}
пароль: ${password}`
      );
      await instructionsCommand(ctx);
    } catch (error) {
      await usersConnector.deleteUser(ctx.wizard.state.user.chatId);
      ctx.reply("Произошла ошибка при регистрации, обратитесь к разработчку");
      console.log(
        "Произошла ошибка при регистрации пользователя " + user.login,
        error
      );
    } finally {
      return registrationExitCommand(ctx);
    }
  }
);

registrationScene.hears(CMD_TEXT.registrationExit, (ctx) => {
  ctx.reply("Вы на главной странице", Markup.removeKeyboard(true));
  ctx.scene.leave();
});

module.exports = { registrationScene };
