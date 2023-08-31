const { Scenes } = require("telegraf");
const {
  SCENE_IDS,
  EMAIL_REGEXP,
  PHONE_REGEXP,
  CMD_TEXT,
} = require("../../constants");
const instructionsCommand = require("../instructions");
const {
  getUserPersonalDataFromContext,
  generatePassword,
} = require("../../utils/common");
const { addUserToSecrets } = require("../../utils/secrets");
const {
  backMenuButtons,
  mainMenuButtons,
} = require("../../components/buttons");
const backMenu = require("../backMenu");
const { usersConnector } = require("../../db");

const registrationScene = new Scenes.WizardScene(
  SCENE_IDS.REGISTRATION,
  async (ctx) => {
    const { name, id } = getUserPersonalDataFromContext(ctx);
    const existedUser = await usersConnector.getUserByChatId(id);
    // if (existedUser) {
    //   await ctx.reply("Данный пользователь уже зарегистрирован");
    //   ctx.scene.leave();
    //   return;
    // }
    // инициализация формы пользователя
    ctx.wizard.state.user = {};

    // сохранение пользовательских данных
    ctx.wizard.state.user.name = name;
    ctx.wizard.state.user.chatId = id;

    ctx.reply("Введите ваш телефон в формате 79998887766", {
      ...backMenuButtons,
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!PHONE_REGEXP.test(ctx.message.text)) {
      ctx.reply("Введите номер корректно");
      return;
    }
    const existedPhone = await usersConnector.getUserByPhone(ctx.message.text);
    if (existedPhone) {
      await ctx.reply(
        "Пользователь с указаным номером уже зарегистрирован в системе"
      );
      ctx.scene.leave();
      return backMenu(ctx);
    }
    ctx.wizard.state.user.phone = ctx.message.text;

    ctx.reply("Введите вашу электронную почту в формате: test@mail.ru");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!EMAIL_REGEXP.test(ctx.message.text)) {
      ctx.reply("Введите корректную почту");
      return;
    }
    ctx.wizard.state.user.email = ctx.message.text;

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
пароль: ${password}`,
        { ...mainMenuButtons }
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
      ctx.scene.leave();
      return backMenu(ctx);
    }
  }
);

registrationScene.hears(CMD_TEXT.menu, (ctx) => {
  ctx.scene.leave();
  return backMenu(ctx);
});

module.exports = { registrationScene };
