const cron = require("node-cron");
const dayjs = require("dayjs");
const { paymentConnector } = require("../../server");
const { ADMIN_CHAT_ID } = require("../../constants");
const logger = require("../logger");

const formatMoney = (value) => `${Number(value || 0)}₽`;

const paymentsReportTask = async (bot) => {
  try {
    const now = dayjs();
    const from = now.subtract(1, "day");
    const payments = await paymentConnector.getPayments();

    const dailyPayments = payments.filter((payment) => {
      const sourceDate = payment?.date || payment?.createdAt;
      if (!sourceDate) {
        return false;
      }
      const d = dayjs(sourceDate);
      return d.isValid() && (d.isAfter(from) || d.isSame(from)) && d.isBefore(now);
    });

    if (!dailyPayments.length) {
      await bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        "Отчёт по оплатам за сутки: новых оплат нет.",
      );
      return;
    }

    const total = dailyPayments.reduce(
      (sum, payment) => sum + Number(payment?.amount || 0),
      0,
    );

    const lines = dailyPayments.map((payment, idx) => {
      const phone = payment?.phone || "—";
      const months = Number(payment?.period || 0);
      const amount = formatMoney(payment?.amount);
      return `${idx + 1}. ${phone} — ${months} мес — ${amount}`;
    });

    const message =
      `Отчёт по оплатам за сутки (${from.format("DD.MM.YYYY HH:mm")} — ${now.format("DD.MM.YYYY HH:mm")}):\n\n` +
      `${lines.join("\n")}\n\n` +
      `Итого за сутки: ${formatMoney(total)}`;

    await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);
  } catch (error) {
    logger.error("Ошибка ежедневного отчёта по оплатам", error);
  }
};

const runDailyPaymentsReportSheduler = (bot, interval = "5 0 * * *") => {
  // Every day at 00:05, send report for previous 24 hours.
  cron.schedule(interval, () => {
    paymentsReportTask(bot);
  });
};

module.exports = { runDailyPaymentsReportSheduler };
