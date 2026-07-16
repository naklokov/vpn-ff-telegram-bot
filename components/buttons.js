const { Markup } = require("telegraf");
const dayjs = require("dayjs");
const { CMD, USERS_TEXT, ADMIN_CHAT_ID } = require("../constants");
const { getUserPersonalDataFromContext } = require("../utils/common");
const { usersConnector } = require("../server");
const { getSubscriptionUrlByPhone } = require("../utils/remnawave");
const { buildRegistrationUrl } = require("../utils/registration-link");

const ADMIN_MENU_SEPARATOR_CALLBACK = "admin_menu_separator";

const exitButtonScene = Markup.keyboard([[USERS_TEXT.exitScene]]).resize();

const exitButton = Markup.keyboard([[USERS_TEXT.goToMain]]).resize();

const hideButtons = {
  reply_markup: { remove_keyboard: true },
};

const toTwoColumns = (buttons) => {
  const rows = [];

  for (let index = 0; index < buttons.length; index += 2) {
    rows.push(buttons.slice(index, index + 2));
  }

  return rows;
};

const getMainMenuText = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const dbUser = await usersConnector.getUserByChatId(chatId);

  if (!dbUser?.phone) {
    return (
      "👋 Приветствую Вас!\n\n" +
      `Для доступа к VPN пройдите регистрацию через кнопку «${USERS_TEXT.registration}».\n\n` +
      `Если вы уже регистрировались на сайте — привяжите email через кнопку «${USERS_TEXT.bindEmail}».`
    );
  }

  const subscriptionUrl = await getSubscriptionUrlByPhone(dbUser.phone);
  const expiredDate = dbUser.expiredDate
    ? dayjs(dbUser.expiredDate).format("DD.MM.YYYY")
    : "—";

  const linkLine = subscriptionUrl
    ? `<a href="${subscriptionUrl}">${subscriptionUrl}</a>`
    : "временно недоступна";

  const referralUrl = buildRegistrationUrl({
    referralUserLogin: String(dbUser.phone).replace(/\D/g, ""),
  });
  const referralLine = `<a href="${referralUrl}">${referralUrl}</a>`;

  return (
    "👋 Приветствую Вас!\n\n" +
    `Ваша подписка доступна по ссылке:\n${linkLine}\n\n` +
    `Окончание срока действия подписки: <b>${expiredDate}</b>\n\n` +
    `🎁 Отправь ссылку другу, получи бонус:\n${referralLine}`
  );
};

const getMainMenu = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const dbUser = await usersConnector.getUserByChatId(chatId);
  const isAdmin = chatId === ADMIN_CHAT_ID;
  const isUserRegistered = dbUser?.chatId;

  const rows = [];

  if (isAdmin) {
    rows.push(
      ...toTwoColumns([
        Markup.button.callback(USERS_TEXT.extend, CMD.extend),
        Markup.button.callback(USERS_TEXT.rupor, CMD.rupor),
        Markup.button.callback(USERS_TEXT.emailRupor, CMD.emailRupor),
        Markup.button.callback(USERS_TEXT.checkUser, CMD.checkUser),
        Markup.button.callback(USERS_TEXT.migrateToSlave, CMD.migrateToSlave),
      ]),
    );
    rows.push([
      Markup.button.callback(
        USERS_TEXT.adminMenuSeparator,
        ADMIN_MENU_SEPARATOR_CALLBACK,
      ),
    ]);
  }

  if (isUserRegistered) {
    rows.push([
      Markup.button.callback(USERS_TEXT.instructions, CMD.instructions),
    ]);
    rows.push([Markup.button.callback(USERS_TEXT.pay, CMD.pay)]);
  }

  const buttons = [];

  if (isUserRegistered) {
    buttons.push(Markup.button.callback(USERS_TEXT.referral, CMD.referral));
  } else {
    buttons.push(
      Markup.button.callback(USERS_TEXT.registration, CMD.registration),
      Markup.button.callback(USERS_TEXT.bindEmail, CMD.bindEmail),
    );
  }

  buttons.push(
    Markup.button.callback(USERS_TEXT.info, CMD.info),
    Markup.button.callback(USERS_TEXT.help, CMD.help),
  );

  rows.push(...toTwoColumns(buttons));

  return Markup.inlineKeyboard(rows);
};

module.exports = {
  exitButton,
  exitButtonScene,
  hideButtons,
  getMainMenu,
  getMainMenuText,
  ADMIN_MENU_SEPARATOR_CALLBACK,
};
