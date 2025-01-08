const { usersConnector } = require("../../db");
const dayjs = require("dayjs");
const { updateVlessUser, addVlessUser } = require("../../utils/vless");

const updateReferralUser = async (phone, ctx) => {
  const extendedUser = await usersConnector.getUserByPhone(phone);

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
        1,
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

    return isNeedBonus;
  }
};

const updateUser = async (phone, months, ctx) => {
  if (!phone || !months) {
    throw Error("Отсутствуют данные для продления");
  }

  const dbUser = await usersConnector.getUserByPhone(phone);

  if (!months) {
    throw Error("Не указано количество месяцев для продления");
  }

  const updatedExpiredDateJs = dayjs(
    dbUser?.isActive ? dbUser?.expiredDate : undefined,
  ).add(+months, "months");
  await usersConnector.updateUserByPhone(phone, {
    expiredDate: updatedExpiredDateJs.toISOString(),
    isVless: true,
  });

  // временный механизм обновления пользователя который уже в системе,чтобы не просрать expiryTime
  if (dbUser?.isVless) {
    await updateVlessUser({
      phone: dbUser.phone,
      chatId: dbUser.chatId,
      expiryTime: updatedExpiredDateJs.toDate(),
    });
  } else {
    await addVlessUser({
      phone: dbUser.phone,
      chatId: dbUser.chatId,
      expiryTime: updatedExpiredDateJs.toDate(),
    });

    await ctx.telegram.sendMessage(
      dbUser.chatId,
      'Перенёс вас на новый сервер, чтобы подключить новый ВПН нажмите на команду /instructions, или выберите внизу в "Меню" -> "Инструкции по подключению',
    );
  }

  await ctx.reply(
    `Пользователь ${phone} успешно продлён на ${
      months
    } мес до ${updatedExpiredDateJs.format("DD.MM.YYYY")}`,
  );

  if (dbUser?.chatId) {
    await ctx.telegram.sendMessage(
      dbUser.chatId,
      `Ваш доступ успешно продлён на ${
        months
      } мес до ${updatedExpiredDateJs.format("DD.MM.YYYY")}
Приятного пользования!`,
    );

    await ctx.telegram.sendMessage(
      dbUser.chatId,
      `⚠️ ВНИМАНИЕ! Старый сервер VPN больше не работает, если вы НЕ подключаетесь к VPN через Streissand или Hiddify, то переходите на новый сервер по инструкции`,
    );
  }
};

const extendUser = async (phone, months, ctx) => {
  // проверяем наличие реферального приглашения и продлеваем тому кто прислал пользование
  await updateReferralUser(phone, ctx);

  // обновляем expiredDate пользователя и высылаем ему уведомление
  await updateUser(phone, months, ctx);
};

module.exports = { extendUser };
