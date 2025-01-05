const {
  addClientToInbound,
  updateClient,
  getInbounds,
} = require("../api/vless");
const { getExpiredDate, convertToUnixDate } = require("./common");

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

const addVlessUser = async ({ phone, chatId, expiryTime: inputExpiryTime }) => {
  const expiryTime = inputExpiryTime
    ? new Date(inputExpiryTime)
    : getExpiredDate();
  const expiryTimeUnix = convertToUnixDate(new Date(expiryTime));
  const inbounds = await getInbounds();
  const { id } = inbounds?.[0] ?? {};

  await addClientToInbound(id, {
    chatId,
    email: phone,
    id: phone,
    expiryTime: expiryTimeUnix,
  });
};

const updateVlessUser = async ({ phone, chatId, expiryTime }) => {
  const expiryTimeUnix = convertToUnixDate(new Date(expiryTime));
  const inbounds = await getInbounds();
  const { id } = inbounds?.[0] ?? {};

  const client = await updateClient(id, {
    chatId,
    email: phone,
    id: phone,
    expiryTime: expiryTimeUnix,
  });

  return client;
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

const getVlessClient = async (id) => {
  const inbounds = await getInbounds();

  const { clients } = JSON.parse(inbounds?.[0]?.settings ?? {});

  return clients?.find((client) => client.id === id);
};

module.exports = {
  addVlessUser,
  updateVlessUser,
  generateVlessConnectionString,
  getVlessConnectionString,
  getVlessClient,
};
