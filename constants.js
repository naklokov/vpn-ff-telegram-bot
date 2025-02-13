const CMD_TEXT = {
  registrationExit: "Выход из регистрации",
  exit: "Выход на главную",
};

const CMD = {
  start: "start",
  registration: "registration",
  info: "info",
  referral: "referral",
  status: "status",
  help: "help",
  instructions: "instructions",
  extend: "extend",
  restart: "restart",
  pay: "pay",
  migrate: "migrate",
  rupor: "rupor",
};

const CALLBACK_QUERY_DATA = {
  instructionsVless: "instructions_vless",
  instructionsIpsec: "instructions_ipsec",
  instructionsIosVless: "instructions_ios_vless",
  instructionsAndroidVless: "instructions_android_vless",
  instructionsWindowsVless: "instructions_windows_vless",
  instructionsIosIpsec: "instructions_ios_ipsec",
  instructionsAndroidIpsec: "instructions_android_ipsec",
  extendOnError: "extend_on_error",
};

const NOTION_PAGE_ID_MAP = {
  IOS_INSTRUCTIONS: "0f60ca2d-58af-4834-9eba-abbbb4ecb503",
};

const ADMIN_CHAT_ID = 332529322;

const SCENE_IDS = {
  REGISTRATION: "REGISTRATION_SCENE_ID",
  EXTEND: "EXTEND",
  MIGRATE: "MIGRATE",
  RUPOR: "RUPOR",
  PAY: "PAY",
};

const IOS_INSTRUCTIONS_LINK =
  "https://www.notion.so/naklokov/iOS-0f60ca2d58af48349ebaabbbb4ecb503";
const ANDROID_INSTRUCTIONS_LINK =
  "https://www.notion.so/naklokov/android-b694609f436f4cb086fd620801bd5540";

const EMAIL_REGEXP =
  // eslint-disable-next-line no-useless-escape
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

const PHONE_REGEXP = /^7[0-9]{10}$/i;

const FREE_PERIOD_DAYS = 7;

const SECRET_ROW_REGEXP = /^(.+) : EAP "(.+)"$/i;

const VPN_DB_CONNECTION = process.env.MONGO_URL + "vpn";

const CALLBACK_QUERY_DATA_DELIMETER = ":";

module.exports = {
  CMD,
  CMD_TEXT,
  NOTION_PAGE_ID_MAP,
  SCENE_IDS,
  IOS_INSTRUCTIONS_LINK,
  ANDROID_INSTRUCTIONS_LINK,
  EMAIL_REGEXP,
  PHONE_REGEXP,
  FREE_PERIOD_DAYS,
  VPN_DB_CONNECTION,
  SECRET_ROW_REGEXP,
  ADMIN_CHAT_ID,
  CALLBACK_QUERY_DATA,
  CALLBACK_QUERY_DATA_DELIMETER,
};
