const { usersConnector } = require("../../server");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { exitButton } = require("../../components/buttons");
const { buildRegistrationUrl } = require("../../utils/registration-link");

module.exports = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  const user = await usersConnector.getUserByChatId(chatId);

  if (!user?.chatId) {
    await ctx.reply(
      `Вы пока что не зарегистрированы в системе, пройдите регистрацию`,
    );
    return;
  }

  await ctx.replyWithMarkdown(
    `Перешли ссылку ниже другому человеку и получи бонусные дни ВПН!

Если зарегистрированный по ссылке пользователь оплатит подписку, ты автоматически получишь бонус за *каждый* его платёж:

• оплата на 1 месяц — *2 дня*
• оплата на 3 месяца — *5 дней*
• оплата на 6 месяцев — *9 дней*

Отправь ссылку ниже другому человеку 👇👇👇
`,
  );

  const referralUrl = buildRegistrationUrl({
    referralUserLogin: String(user.phone).replace(/\D/g, ""),
  });

  await ctx.replyWithHTML(`<a href="${referralUrl}">${referralUrl}</a>`, {
    ...exitButton,
    link_preview_options: { is_disabled: false },
  });
};
