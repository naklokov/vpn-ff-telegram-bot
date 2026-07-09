const { getMainMenu, getMainMenuText, hideButtons } = require("../components/buttons");
const { getUserPersonalDataFromContext, isMenuCommand } = require("./common");

const ensureSession = (ctx) => {
  if (!ctx.session) {
    ctx.session = {};
  }

  return ctx.session;
};

const REPLY_METHODS = [
  "reply",
  "replyWithHTML",
  "replyWithMarkdown",
  "replyWithMarkdownV2",
];

const initSceneTracking = (ctx) => {
  if (!ctx.wizard?.state) {
    return;
  }

  if (!Array.isArray(ctx.wizard.state._botMessageIds)) {
    ctx.wizard.state._botMessageIds = [];
  }

  if (!Array.isArray(ctx.wizard.state._userMessageIds)) {
    ctx.wizard.state._userMessageIds = [];
  }
};

const trackBotMessage = (ctx, message) => {
  if (!message?.message_id || !ctx.wizard?.state?._botMessageIds) {
    return;
  }

  ctx.wizard.state._botMessageIds.push(message.message_id);
};

const trackUserMessage = (ctx) => {
  if (!ctx.message?.message_id || !ctx.wizard?.state?._userMessageIds) {
    return;
  }

  ctx.wizard.state._userMessageIds.push(ctx.message.message_id);
};

const patchReplyMethods = (ctx) => {
  if (ctx._sceneUiReplyPatched) {
    return;
  }

  ctx._sceneUiReplyPatched = true;

  for (const methodName of REPLY_METHODS) {
    const originalMethod = ctx[methodName]?.bind(ctx);
    if (!originalMethod) {
      continue;
    }

    ctx[methodName] = async (...args) => {
      const message = await originalMethod(...args);
      trackBotMessage(ctx, message);
      return message;
    };
  }
};

const removeReplyKeyboard = async (ctx) => {
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  if (!chatId) {
    return;
  }

  try {
    const message = await ctx.telegram.sendMessage(chatId, "\u200b", hideButtons);
    await ctx.telegram.deleteMessage(chatId, message.message_id);
  } catch {
    // ignore: keyboard may already be hidden
  }
};

const deleteTrackedSceneMessages = async (ctx, options = {}) => {
  const { keepLastBotMessages = 0 } = options;
  const botMessageIds = [...(ctx.wizard?.state?._botMessageIds ?? [])];
  const userMessageIds = ctx.wizard?.state?._userMessageIds ?? [];
  const { id: chatId } = getUserPersonalDataFromContext(ctx);

  if (!chatId) {
    return;
  }

  const botIdsToDelete =
    keepLastBotMessages > 0
      ? botMessageIds.slice(0, -keepLastBotMessages)
      : botMessageIds;

  for (const messageId of [...botIdsToDelete, ...userMessageIds]) {
    try {
      await ctx.telegram.deleteMessage(chatId, messageId);
    } catch {
      // message may be too old or already deleted
    }
  }
};

const getMainMenuExtra = async (ctx) => {
  const menu = await getMainMenu(ctx);

  return {
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...menu,
  };
};

const showMainMenu = async (ctx, options = {}) => {
  const { forceNew = false } = options;
  const { id: chatId } = getUserPersonalDataFromContext(ctx);
  if (!chatId) {
    return;
  }

  const session = ensureSession(ctx);
  const text = await getMainMenuText(ctx);
  const extra = await getMainMenuExtra(ctx);

  if (!forceNew && session.menuMessageId) {
    try {
      await ctx.telegram.editMessageText(
        chatId,
        session.menuMessageId,
        undefined,
        text,
        extra,
      );
      return session.menuMessageId;
    } catch {
      // menu message is gone or cannot be edited
    }
  }

  const message = await ctx.reply(text, extra);
  session.menuMessageId = message.message_id;
  return message.message_id;
};

const exitToMenu = async (ctx, options = {}) => {
  const {
    showMenu = true,
    cleanScene = true,
    keepLastBotMessages = 0,
  } = options;

  if (ctx.scene?.current) {
    await ctx.scene.leave();
  }

  if (cleanScene) {
    await deleteTrackedSceneMessages(ctx, { keepLastBotMessages });
  }

  await removeReplyKeyboard(ctx);

  if (showMenu) {
    await showMainMenu(ctx);
  }
};

const consumeSceneEntryCallback = async (ctx) => {
  if (
    !ctx.wizard ||
    ctx.wizard.cursor <= 0 ||
    !ctx.callbackQuery?.data ||
    !isMenuCommand(ctx.callbackQuery.data) ||
    ctx.wizard.state?._entryCallbackConsumed
  ) {
    return false;
  }

  ctx.wizard.state._entryCallbackConsumed = true;

  try {
    await ctx.answerCbQuery();
  } catch {
    // ignore
  }

  return true;
};

const applySceneUi = (scene) => {
  scene.use(async (ctx, next) => {
    initSceneTracking(ctx);
    patchReplyMethods(ctx);
    trackUserMessage(ctx);

    if (await consumeSceneEntryCallback(ctx)) {
      return;
    }

    await next();
  });
};

module.exports = {
  applySceneUi,
  exitToMenu,
  showMainMenu,
};
