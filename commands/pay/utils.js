var Tesseract = require("tesseract.js");
const { MONTH_COST, ADMIN_CHAT_ID } = require("../../constants");
const { getUserPersonalDataFromContext } = require("../../utils/common");
const { usersConnector } = require("../../db");

const logger = require("../../utils/logger");

const checkPaymentOnImage = async (amount, imgPath) => {
  const recognizedRus = await Tesseract.recognize(imgPath, "rus");
  const recognizedEng = await Tesseract.recognize(imgPath, "rus");
  const amountRegExp = new RegExp(`(${amount})[\\s|.|,]{1}`);
  if (recognizedRus?.data?.text || recognizedEng?.data?.text) {
    return (
      amountRegExp.test(recognizedRus?.data?.text) ||
      amountRegExp.test(recognizedEng?.data?.text)
    );
  }

  return false;
};

const checkPayment = async (ctx) => {
  if (ctx?.message?.photo) {
    try {
      const fileId =
        ctx?.message?.photo?.[ctx?.message?.photo.length - 2]?.file_id;
      const { href } = await ctx.telegram.getFileLink(fileId);
      const amount = MONTH_COST * ctx.wizard.state.extend.months;
      const isPayCorrect = await checkPaymentOnImage(amount, href);
      return isPayCorrect;
    } catch (error) {
      logger.error("Произошла ошибка при обработке изображения", error);
      return false;
    }
  }

  await ctx.reply(
    `Вы прикладываете не изображение, необходимо прикрепить изображение как подтверждение оплаты`,
  );
  return false;
};

const sendAdminPaymentInfo = async (ctx, message = "") => {
  // const { id: chatId } = getUserPersonalDataFromContext(ctx);
  // const dbUser = await usersConnector.getUserByChatId(chatId);
  // await ctx.forwardMessage(ADMIN_CHAT_ID, ctx.message.text);
  //   await ctx.telegram.sendMessage(
  //     ADMIN_CHAT_ID,
  //     `${message}
  // \`${dbUser.phone}\`   ${ctx.wizard.state.extend.months} мес`,
  //     { parse_mode: "MarkdownV2" },
  //   );
};

module.exports = { checkPayment, sendAdminPaymentInfo };
