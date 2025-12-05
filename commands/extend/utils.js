const { usersConnector } = require("../../db");
const dayjs = require("dayjs");
const { updateVlessUser } = require("../../utils/vless");
const { convertToUnixDate } = require("../../utils/common");
const {
  updateRemnawaveUserByPhone,
  addRemnawaveUser,
  getSubscriptionUrlByPhone,
} = require("../../utils/remnawave");
const { REMNAWAVE_PREFIX, DEVELOPER_CONTACT } = require("../../constants");

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

      console.log(referralUser);

      const bonusExpiredDate = dayjs(referralUser?.expiredDate).add(
        1,
        "months",
      );

      await usersConnector.updateUserByPhone(referralUser?.phone, {
        expiredDate: bonusExpiredDate.toISOString(),
      });

      if (referralUser?.serverPrefix === REMNAWAVE_PREFIX) {
        await updateRemnawaveUserByPhone(referralUser.phone, {
          expireAt: bonusExpiredDate.toISOString(),
        });
      } else {
        await updateVlessUser({
          chatId: referralUser.chatId,
          phone: referralUser.phone,
          serverPrefix: referralUser?.serverPrefix,
          expireAt: convertToUnixDate(new Date(bonusExpiredDate)),
        });
      }

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

  const updateExpiredAt = dayjs(dbUser?.expiredDate).add(+months, "months");

  // Переносим пользователя на сервер при оплате
  if (dbUser?.serverPrefix !== REMNAWAVE_PREFIX) {
    try {
      console.log("test1", updateExpiredAt);
      await addRemnawaveUser({
        username: phone,
        chatId: dbUser.chatId,
        description: dbUser.name,
        email: dbUser.email,
        expireAt: updateExpiredAt.toISOString(),
      });

      const subscriptionUrl = await getSubscriptionUrlByPhone(dbUser.phone);
      await ctx.telegram.sendMessage(
        dbUser.chatId,
        "❗️ Перенёс вас на новый сервер ❗️",
      );
      await ctx.telegram.sendMessage(
        dbUser.chatId,
        "Для настройки VPN перейдите по ссылке ниже 👇👇👇\n" +
          `${subscriptionUrl}`,
      );
      ctx.telegram.sendMessage(
        dbUser.chatId,
        `Если возникнут вопросы, пишите 👉 ${DEVELOPER_CONTACT}`,
      );
    } catch (error) {
      throw Error(error);
    }
  } else {
    console.log("test2", updateExpiredAt);
    await updateRemnawaveUserByPhone(phone, {
      expireAt: updateExpiredAt.toISOString(),
    });
  }

  console.log("test3", updateExpiredAt);
  await usersConnector.updateUserByPhone(phone, {
    expiredDate: updateExpiredAt.toISOString(),
    serverPrefix: REMNAWAVE_PREFIX,
  });

  await ctx.reply(
    `Пользователь ${phone} успешно продлён на ${
      months
    } мес до ${updateExpiredAt.format("DD.MM.YYYY")}`,
  );

  if (dbUser?.chatId) {
    await ctx.telegram.sendMessage(
      dbUser.chatId,
      `Ваш доступ успешно продлён на ${
        months
      } мес до ${updateExpiredAt.format("DD.MM.YYYY")}
Приятного пользования!`,
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
