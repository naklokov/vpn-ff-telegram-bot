const mongoose = require("mongoose");
const logger = require("../utils/logger");

const { VPN_DB_CONNECTION } = require("../constants");

const paymentScheme = new mongoose.Schema({
  chatId: { type: Number, required: true },
  period: { type: Number, required: true },
  amount: { type: Number, required: true },
  phone: { type: String, required: true },
  date: {
    type: String,
    required: true,
  },
});

const Payment = mongoose.model("Payment", paymentScheme);

const savePayment = async ({ chatId, period, amount, phone, date }) => {
  const newPayment = new Payment({ chatId, period, amount, phone, date });
  try {
    await mongoose.connect(VPN_DB_CONNECTION);
    await newPayment.save();
    logger.info(`Платёж пользователя ${phone} добавлен в БД`);
  } catch (error) {
    logger.info(
      `Произошла ошибка при добавлении платежа в БД ${phone}: ${error}`,
    );
    throw error;
  }
};

module.exports = {
  savePayment,
};
