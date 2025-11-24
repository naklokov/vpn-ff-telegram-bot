const {
  addClientToInbound,
  updateClient,
  getInbounds,
} = require("../api/vless");
const { getExpiredDate, convertToUnixDate } = require("./common");

const generateVlessConnectionString = ({
  userId,
  userEmail,
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
  tlsAlpn,
  grpcServiceName,
  grpcAuthority,
}) => {
  const base = `${serverProtocol}://${userId}@${host}:${port}`;
  const qs = new URLSearchParams();

  // Общие параметры
  qs.set("type", serverNetwork);
  qs.set("security", serverSecurity);

  if (serverNetwork === "grpc") {
    qs.set("encryption", "none");
    if (grpcServiceName) {
      qs.set("serviceName", grpcServiceName);
    }
    if (grpcAuthority !== undefined) {
      qs.set("authority", grpcAuthority);
    }
  }

  if (serverSecurity === "reality") {
    if (serverPublicId) {
      qs.set("pbk", serverPublicId);
    }
    if (serverFingerprint) {
      qs.set("fp", serverFingerprint);
    }
    if (serverName) {
      qs.set("sni", serverName);
    }
    if (serverShortId) {
      qs.set("sid", serverShortId);
    }
    qs.set("spx", "/");
  } else if (serverSecurity === "tls") {
    // Вариант 2: grpc + tls
    if (serverFingerprint) {
      qs.set("fp", serverFingerprint);
    }
    if (Array.isArray(tlsAlpn) && tlsAlpn.length > 0) {
      qs.set("alpn", tlsAlpn.join(","));
    }
    if (serverName) {
      qs.set("sni", serverName);
    }
  }

  return `${base}?${qs.toString()}#${serverDescription}-${userEmail}`;
};

const addVlessUser = async ({
  phone,
  chatId,
  serverPrefix,
  expiryTime: inputExpiryTime,
}) => {
  const expiryTime = inputExpiryTime
    ? new Date(inputExpiryTime)
    : getExpiredDate();
  const expiryTimeUnix = convertToUnixDate(new Date(expiryTime));
  const inbounds = await getInbounds(serverPrefix);
  const { id } = inbounds?.[0] ?? {};

  await addClientToInbound(id, {
    chatId,
    email: phone,
    id: phone,
    expiryTime: expiryTimeUnix,
    serverPrefix,
  });
};

const updateVlessUser = async ({
  phone,
  chatId,
  expiryTime,
  serverPrefix = "",
}) => {
  const expiryTimeUnix = convertToUnixDate(new Date(expiryTime));
  const inbounds = await getInbounds(serverPrefix);
  const { id } = inbounds?.[0] ?? {};

  const client = await updateClient(id, {
    chatId,
    email: phone,
    id: phone,
    expiryTime: expiryTimeUnix,
    serverPrefix,
  });

  return client;
};

const getVlessConnectionString = async (phone, serverPrefix = "") => {
  const inbounds = await getInbounds(serverPrefix);
  const inbound = inbounds?.[0];

  if (!inbound) {
    throw new Error("No inbounds returned from server");
  }

  const { remark, protocol, port, streamSettings } = inbound;

  // streamSettings приходит строкой – парсим
  const { realitySettings, security, network, tlsSettings, grpcSettings } =
    JSON.parse(streamSettings || "{}");

  const host = process.env[`${serverPrefix}VPN_HOST`] ?? process.env.VPN_HOST;

  const baseParams = {
    userId: phone,
    userEmail: phone,
    serverProtocol: protocol,
    host,
    port,
    serverDescription: remark,
    serverNetwork: network,
    serverSecurity: security,
  };

  // Вариант 1: tcp + reality
  if (security === "reality") {
    return generateVlessConnectionString({
      ...baseParams,
      serverPublicId: realitySettings?.settings?.publicKey,
      serverFingerprint: realitySettings?.settings?.fingerprint,
      serverName: realitySettings?.serverNames?.[0],
      serverShortId: realitySettings?.shortIds?.[0],
    });
  }

  // Вариант 2: grpc + tls
  if (security === "tls" && network === "grpc") {
    return generateVlessConnectionString({
      ...baseParams,
      serverFingerprint: tlsSettings?.settings?.fingerprint,
      serverName: tlsSettings?.serverName,
      tlsAlpn: tlsSettings?.alpn,
      grpcServiceName: grpcSettings?.serviceName,
      grpcAuthority: grpcSettings?.authority ?? "",
    });
  }

  // Фолбек на случай других комбинаций
  return generateVlessConnectionString(baseParams);
};

const getVlessClient = async (id, serverPrefix = "") => {
  const inbounds = await getInbounds(serverPrefix);

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
