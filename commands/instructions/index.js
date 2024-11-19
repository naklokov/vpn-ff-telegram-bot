const {
  IOS_INSTRUCTIONS_LINK,
  ANDROID_INSTRUCTIONS_LINK,
  CMD,
} = require('../../constants');
const { usersConnector } = require('../../db');
const { getUserPersonalDataFromContext } = require('../../utils/common');

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию 👉 /${CMD.registration}`
    );
    return;
  }

  var options = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'IOS (Apple)', url: IOS_INSTRUCTIONS_LINK }],
        [{ text: 'Android', url: ANDROID_INSTRUCTIONS_LINK }],
      ],
    }),
  };
  await ctx.reply(
    `Логин и пароль ниже копируются по клику

логин: \`${user?.phone}\`
пароль: \`${user?.password}\``,
    { parse_mode: 'MarkdownV2' }
  );
  await ctx.reply('Инструкции по подключению VPN', options);
};
