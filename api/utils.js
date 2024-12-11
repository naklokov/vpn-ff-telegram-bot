const getVlessFullClient = ({ id, chatId, email, expiryTime }) => {
  return {
    clients: [
      {
        id,
        flow: "",
        email,
        limitIp: 0,
        totalGB: 0,
        expiryTime,
        enable: true,
        tgId: chatId,
      },
    ],
  };
};

module.exports = { getVlessFullClient };
