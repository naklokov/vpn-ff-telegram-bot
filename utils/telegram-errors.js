const isBotBlockedError = (error) => {
  const response = error?.response;
  if (response?.error_code === 403) {
    const description = String(response.description ?? "").toLowerCase();
    return description.includes("blocked");
  }

  const message = String(error?.message ?? "").toLowerCase();
  return message.includes("403") && message.includes("blocked");
};

module.exports = { isBotBlockedError };
