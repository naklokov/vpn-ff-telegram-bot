const { Markup } = require("telegraf");
const { CMD, USERS_TEXT, ADMIN_CHAT_ID } = require("../constants");
const { getUserPersonalDataFromContext } = require("../utils/common");
const { usersConnector } = require("../db");

const exitButtonScene = Markup.keyboard([[USERS_TEXT.exitScene]]).resize();

const exitButton = Markup.keyboard([[USERS_TEXT.goToMain]]).resize();

const hideButtons = {
  reply_markup: { remove_keyboard: true },
};

const getMainMenu = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const dbUser = await usersConnector.getUserByChatId(chatId);
  const isAdmin = chatId === ADMIN_CHAT_ID;
  const isUserRegistered = dbUser?.chatId;

  let keyboardButtons = [[Markup.button.callback(USERS_TEXT.help, CMD.help)]];

  if (isUserRegistered) {
    keyboardButtons.unshift([
      Markup.button.callback(USERS_TEXT.referral, CMD.referral),
    ]);

    keyboardButtons.unshift([
      Markup.button.callback(USERS_TEXT.instructions, CMD.instructions),
    ]);
    keyboardButtons.unshift([Markup.button.callback(USERS_TEXT.pay, CMD.pay)]);
    keyboardButtons.unshift([
      Markup.button.callback(USERS_TEXT.info, CMD.info),
    ]);
  } else {
    keyboardButtons.unshift([
      Markup.button.callback(USERS_TEXT.registration, CMD.registration),
    ]);
  }

  if (isAdmin) {
    keyboardButtons.unshift([
      Markup.button.callback(USERS_TEXT.migrate, CMD.migrate),
    ]);
    keyboardButtons.unshift([
      Markup.button.callback(USERS_TEXT.rupor, CMD.rupor),
    ]);
    keyboardButtons.unshift([
      Markup.button.callback(USERS_TEXT.extend, CMD.extend),
    ]);
  }

  return Markup.inlineKeyboard(keyboardButtons).resize();
};

module.exports = {
  exitButton,
  exitButtonScene,
  hideButtons,
  getMainMenu,
};
