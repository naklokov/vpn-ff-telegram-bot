const { exitButton } = require("../../components/buttons");
const { DEVELOPER_CONTACT } = require("../../constants");

module.exports = (ctx) =>
  ctx.reply(
    `Если у вас возникли вопросы, пишите разработчику ${DEVELOPER_CONTACT}`,
    exitButton,
  );
