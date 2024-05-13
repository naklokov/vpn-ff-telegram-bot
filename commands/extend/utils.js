const { usersConnector } = require('../../db');
const dayjs = require('dayjs');

const updateReferralUser = async (ctx) => {
  const extendedUser = await usersConnector.getUserByPhone(
    ctx.wizard.state.extend.login
  );

  if (extendedUser?.referralUserLogin) {
    const isFirstPayment = dayjs(extendedUser.registrationDate).isSame(
      dayjs(extendedUser.expiredDate).subtract(1, 'month')
    );

    if (isFirstPayment) {
      const referralUser = await usersConnector.getUserByPhone(
        extendedUser?.referralUserLogin
      );
      const bonusExpiredDate = dayjs(referralUser?.expiredDate).add(
        1,
        'months'
      );
      await usersConnector.updateUserByPhone(referralUser?.phone, {
        expiredDate: bonusExpiredDate.toISOString(),
      });
      ctx.reply(
        `Ваш период использования продлён за счёт реферальной программы до ${bonusExpiredDate.format('DD.MM.YYYY')}
  
Спасибо, что рекомендуете наш ВПН ❤️`
      );
    }
  }
};

const updateUserExpiredDate = async (ctx) => {
  const user = await usersConnector.getUserByPhone(
    ctx.wizard.state.extend.login
  );

  const payedMonths = ctx.wizard.state.extend.months;
  const updatedExpiredDateJs = dayjs(
    user?.isActive ? user?.expiredDate : undefined
  ).add(+payedMonths, 'months');

  await usersConnector.updateUserByPhone(ctx.wizard.state.extend.login, {
    expiredDate: updatedExpiredDateJs.toISOString(),
  });

  ctx.reply(
    `Пользователь ${ctx.wizard.state.extend.login} успешно продлён на ${
      ctx.wizard.state.extend.months
    } мес до ${updatedExpiredDateJs.format('DD.MM.YYYY')}`
  );
  if (user?.chatId) {
    ctx.telegram.sendMessage(
      user.chatId,
      `Ваш доступ успешно продлён на ${
        ctx.wizard.state.extend.months
      } мес до ${updatedExpiredDateJs.format('DD.MM.YYYY')}
Оплата может проходить до 20 минут
Приятного пользования!`
    );
  }
};

module.exports = { updateReferralUser, updateUserExpiredDate };
