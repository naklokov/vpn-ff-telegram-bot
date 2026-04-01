const axios = require("axios");
const logger = require("./logger");
const { paymentConnector } = require("../server");

const MIME_TYPES = {
  PDF: "application/pdf",
};

const getFilePath = async (fileId, ctx) => {
  const { href = "" } = await ctx.telegram.getFileLink(fileId);
  return href;
};

const getFileBase64ByUrl = async (url) => {
  const { data } = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(data).toString("base64");
};

const checkPaymentPhoto = async (amount, ctx) => {
  try {
    const fileId =
      ctx?.message?.photo?.[ctx?.message?.photo.length - 1]?.file_id;
    const filePath = await getFilePath(fileId, ctx);
    const fileBase64 = await getFileBase64ByUrl(filePath);
    const isPayCorrect = await paymentConnector.checkPayment({
      amount,
      fileBase64,
      mimeType: "image/jpeg",
    });
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
    const fileBase64 = await getFileBase64ByUrl(filePath);
    return await paymentConnector.checkPayment({
      amount,
      fileBase64,
      mimeType: MIME_TYPES.PDF,
    });
  } catch (error) {
    logger.error("Произошла ошибка при обработке PDF", error);
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

  return false;
};

module.exports = { checkPayment };
