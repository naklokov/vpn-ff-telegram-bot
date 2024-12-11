const { getInbounds, addClientToInbound } = require("../api/vless");
const { getExpiredDate } = require("./common");

const { VPN_HOST } = process.env;

const generateVlessConnectionString = ({
  userId,
  serverProtocol,
  host,
  port,
  serverNetwork,
  serverSecurity,
  serverPublicId,
  serverFingerprint,
  serverName,
  serverShortId,
  serverDescription,
  userEmail,
}) =>
  `${serverProtocol}://${userId}@${host}:${port}?type=${serverNetwork}&security=${serverSecurity}&pbk=${serverPublicId}&fp=${serverFingerprint}&sni=${serverName}&sid=${serverShortId}&spx=%2F#${serverDescription}-${userEmail}`;

const addVlessUser = async ({ phone, chatId }) => {
  const inbounds = await getInbounds();
  const { id } = inbounds?.[0] ?? {};
  const expiryTime = Math.floor(getExpiredDate().getTime());
  await addClientToInbound(id, {
    chatId,
    email: phone,
    id: phone,
    expiryTime,
  });
};

const getVlessConnectionString = async (phone) => {
  const inbounds = await getInbounds();
  const { remark, protocol, port, streamSettings } = inbounds?.[0] ?? {};
  const { realitySettings, security, network } = JSON.parse(streamSettings);

  const connectionString = generateVlessConnectionString({
    userId: phone,
    userEmail: phone,
    serverProtocol: protocol,
    port,
    host: VPN_HOST,
    serverPublicId: realitySettings?.settings?.publicKey,
    serverFingerprint: realitySettings?.settings?.fingerprint,
    serverSecurity: security,
    serverShortId: realitySettings?.shortIds?.[0],
    serverDescription: remark,
    serverName: realitySettings?.serverNames?.[0],
    serverNetwork: network,
  });

  return connectionString;
};

module.exports = {
  addVlessUser,
  generateVlessConnectionString,
  getVlessConnectionString,
};
