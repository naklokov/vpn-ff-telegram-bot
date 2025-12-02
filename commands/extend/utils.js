const { usersConnector } = require("../../db");
const dayjs = require("dayjs");
const { updateVlessUser } = require("../../utils/vless");
const {
  convertToUnixDate,
  getUserPersonalDataFromContext,
} = require("../../utils/common");
const { updateRemnawaveUserByPhone } = require("../../utils/remnawave");
const { REMNAWAVE_PREFIX } = require("../../constants");

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
      const expiryTime = convertToUnixDate(new Date(bonusExpiredDate));

      await usersConnector.updateUserByPhone(referralUser?.phone, {
        expiredDate: bonusExpiredDate.toISOString(),
      });

      if (referralUser?.serverPrefix === REMNAWAVE_PREFIX) {
        await updateRemnawaveUserByPhone(referralUser.phone, {
          expireAt: expiryTime,
        });
      } else {
        await updateVlessUser({
          chatId: referralUser.chatId,
          phone: referralUser.phone,
          serverPrefix: referralUser?.serverPrefix,
          expiryTime,
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

  const updatedExpiredDateJs = dayjs(
    dbUser?.isActive ? dbUser?.expiredDate : undefined,
  ).add(+months, "months");
  await usersConnector.updateUserByPhone(phone, {
    expiredDate: updatedExpiredDateJs.toISOString(),
    isVless: true,
  });

  // временный механизм обновления пользователя который уже в системе,чтобы не просрать expiryTime
  // if (dbUser?.serverPrefix !== REMNAWAVE_PREFIX) {
  //   await addRemnawaveUser({
  //     chatId,
  //     phone,
  //     name: ctx.wizard.state.user.name,
  //     email: ctx.wizard.state.user.email,
  //   });
  // }

  // const subscriptionUrl = await getSubscriptionUrlByPhone(dbUser.phone);

  // await ctx.telegram.sendMessage(
  //   dbUser.chatId,
  //   `Перенёс вас на новый сервер, чтобы настроить его нажмите на ссылку ${subscriptionUrl}`,
  // );
  try {
    if (dbUser?.serverPrefix === REMNAWAVE_PREFIX) {
      await updateRemnawaveUserByPhone(phone, {
        expireAt: updatedExpiredDateJs.toDate(),
      });
    } else {
      await updateVlessUser({
        chatId: dbUser.chatId,
        phone: phone,
        expiryTime: updatedExpiredDateJs.toDate(),
      });
    }
  } catch (error) {
    // не падаем сценой, просто логируем
    console.error(
      `Remnawave: ошибка при обновлении пользователя ${phone} после продления`,
      error,
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
  }
};

const extendUser = async (phone, months, ctx) => {
  // проверяем наличие реферального приглашения и продлеваем тому кто прислал пользование
  await updateReferralUser(phone, ctx);

  // обновляем expiredDate пользователя и высылаем ему уведомление
  await updateUser(phone, months, ctx);
};

module.exports = { extendUser };
