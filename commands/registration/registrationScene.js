const { Scenes } = require("telegraf");
const { SCENE_IDS, EMAIL_REGEXP, PHONE_REGEXP } = require("../../constants");
const instructionsCommand = require("../instructions");
const { random } = require("../../utils");

const registrationScene = new Scenes.WizardScene(
  SCENE_IDS.REGISTRATION,
  (ctx) => {
    // инициализация формы пользователя
    ctx.wizard.state.user = {};

    // сохранение пользовательских данных
    const { username, first_name, last_name, id } = ctx.message.chat;
    const name = username || first_name + last_name;
    ctx.wizard.state.user.name = name;
    ctx.wizard.state.user.id = id;

    ctx.reply("Введите ваш телефон в формате 79998887766");
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!PHONE_REGEXP.test(ctx.message.text)) {
      ctx.reply("Введите номер корректно");
      return;
    }
    ctx.wizard.state.user.phone = ctx.message.text;

    ctx.reply("Введите вашу электронную почту в формате: test@mail.ru");
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!EMAIL_REGEXP.test(ctx.message.text)) {
      ctx.reply("Введите корректную почту");
      return;
    }
    ctx.wizard.state.user.email = ctx.message.text;

    ctx.reply("Вы успешно зарегистрированы!");
    ctx.reply(
      `Ваш пароль: ${
        "" + random(0, 20) + ctx.message.chat.id + random(50, 100)
      }`
    );
    instructionsCommand(ctx);
    return ctx.scene.leave();
  }
);

module.exports = { registrationScene };
