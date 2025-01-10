var Tesseract = require("tesseract.js");
const logger = require("./logger");
const { getTextFromPDF } = require("./common");

const MIME_TYPES = {
  PDF: "application/pdf",
};

const getFilePath = async (fileId, ctx) => {
  const { href = "" } = await ctx.telegram.getFileLink(fileId);
  return href;
};

const checkRegexpAmount = (text, amount) => {
  const amountRegExp = new RegExp(`(${amount})[\\s|.|,]{1}`);
  return amountRegExp.test(text);
};

const checkRecognizedImage = async (amount, filePath) => {
  const recognizedRus = await Tesseract.recognize(filePath, "rus");
  return checkRegexpAmount(recognizedRus?.data?.text ?? "", amount);
};

const checkPaymentPhoto = async (amount, ctx) => {
  try {
    const fileId =
      ctx?.message?.photo?.[ctx?.message?.photo.length - 2]?.file_id;
    const filePath = await getFilePath(fileId, ctx);
    const isPayCorrect = await checkRecognizedImage(amount, filePath);
    return isPayCorrect;
  } catch (error) {
    logger.error("Произошла ошибка при обработке изображения", error);
    return false;
  }
};

const checkPaymentPdf = async (amount, ctx) => {
  const { document } = ctx?.message ?? {};
  try {
    const filePath = await getFilePath(document?.file_id, ctx);
    const stringParts = await getTextFromPDF(filePath);
    return checkRegexpAmount(stringParts.join(" "), amount);
  } catch (error) {
    logger.error("Произошла ошибка при обработке изображения", error);
    return false;
  }
};

const checkPayment = async (amount, ctx) => {
  // проверяем если приложен документ
  if (ctx?.message?.document) {
    const { document } = ctx?.message ?? {};
    if (document?.mime_type === MIME_TYPES.PDF) {
      const isPayPdfCorrect = await checkPaymentPdf(amount, ctx);
      return isPayPdfCorrect;
    }
  }

  // проверяем если приложено изображение
  if (ctx?.message?.photo) {
    const isPayPhotoCorrect = await checkPaymentPhoto(amount, ctx);
    return isPayPhotoCorrect;
  }

  await ctx.reply(
    "Вы прикладываете некорректную квитанцию или указали некорректный период оплаты, приложите корректный документ об оплате",
  );
  return false;
};

module.exports = { checkPayment };
