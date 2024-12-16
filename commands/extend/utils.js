const { usersConnector } = require("../../db");
const dayjs = require("dayjs");
const { updateVlessUser } = require("../../utils/vless");

const updateReferralUser = async (ctx) => {
  const extendedUser = await usersConnector.getUserByPhone(
    ctx.wizard.state.extend.login,
  );

  if (extendedUser?.referralUserLogin) {
    const isNeedBonus = dayjs(extendedUser.registrationDate).isAfter(
      dayjs(extendedUser.expiredDate).subtract(1, "month").subtract(2, "days"),
    );

    // если продления больше чем дата регистрации на 1 месяц и два дня, то даём бонус
    if (isNeedBonus) {
      const referralUser = await usersConnector.getUserByPhone(
        extendedUser?.referralUserLogin,
      );

      const bonusExpiredDate = dayjs(referralUser?.expiredDate).add(
        2,
        "months",
      );
      await usersConnector.updateUserByPhone(referralUser?.phone, {
        expiredDate: bonusExpiredDate.toISOString(),
      });
      await ctx.telegram.sendMessage(
        referralUser?.chatId,
        `Ваш период использования продлён за счёт реферальной программы до ${bonusExpiredDate.format("DD.MM.YYYY")}
  
Спасибо, что рекомендуете наш ВПН ❤️`,
      );
    }
  }
};

const updateUserExpiredDate = async (ctx) => {
  const dbUser = await usersConnector.getUserByPhone(
    ctx.wizard.state.extend.login,
  );

  const payedMonths = ctx.wizard.state.extend.months;
  const updatedExpiredDateJs = dayjs(
    dbUser?.isActive ? dbUser?.expiredDate : undefined,
  ).add(+payedMonths, "months");
  await usersConnector.updateUserByPhone(ctx.wizard.state.extend.login, {
    expiredDate: updatedExpiredDateJs.toISOString(),
    isVless: true,
  });

  await updateVlessUser({
    phone: dbUser.phone,
    chatId: dbUser.chatId,
    expiryTime: updatedExpiredDateJs.toDate(),
  });

  await ctx.reply(
    `Пользователь ${ctx.wizard.state.extend.login} успешно продлён на ${
      ctx.wizard.state.extend.months
    } мес до ${updatedExpiredDateJs.format("DD.MM.YYYY")}`,
  );
  if (dbUser?.chatId) {
    await ctx.telegram.sendMessage(
      dbUser.chatId,
      `Ваш доступ успешно продлён на ${
        ctx.wizard.state.extend.months
      } мес до ${updatedExpiredDateJs.format("DD.MM.YYYY")}
Приятного пользования!`,
    );
  }

  if (!dbUser.isVless) {
    await ctx.reply(
      `Инструкции по подключению нового ВПН вы можете найти по команде /instructions`,
    );
  }
};

module.exports = { updateReferralUser, updateUserExpiredDate };
