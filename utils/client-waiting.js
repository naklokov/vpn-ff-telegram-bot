const DEFAULT_INTERVAL_MS = 3000;

const withClientWaiting = async (
  ctx,
  messageText,
  action,
  intervalMs = DEFAULT_INTERVAL_MS,
) => {
  if (messageText) {
    await ctx.reply(messageText);
  }

  const chatActionInterval = setInterval(async () => {
    try {
      await ctx.sendChatAction("typing");
    } catch {
      // ignore chat action errors, do not break the flow
    }
  }, intervalMs);

  try {
    return await action();
  } finally {
    clearInterval(chatActionInterval);
  }
};

module.exports = { withClientWaiting };
