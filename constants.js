const CMD_TEXT = {
  registrationExit: "Выход из регистрации",
};

const CMD = {
  start: "start",
  registration: "registration",
  info: "info",
  help: "help",
};

const NOTION_PAGE_ID_MAP = {
  IOS_INSTRUCTIONS: "0f60ca2d-58af-4834-9eba-abbbb4ecb503",
};

const ADMIN_CHAT_ID = 332529322;

const SCENE_IDS = {
  REGISTRATION: "REGISTRATION_SCENE_ID",
};

const IOS_INSTRUCTIONS_LINK =
  "https://www.notion.so/naklokov/iOS-0f60ca2d58af48349ebaabbbb4ecb503";
const ANDROID_INSTRUCTIONS_LINK =
  "https://www.notion.so/naklokov/android-b694609f436f4cb086fd620801bd5540";

const EMAIL_REGEXP =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

const PHONE_REGEXP = /^7[0-9]{10}$/i;

const FREE_PERIOD_MONTH = 1;

const SECRET_ROW_REGEXP = /^(.+) : EAP "(.+)"$/i;

const VPN_DB_CONNECTION = process.env.MONGO_URL + "vpn";

module.exports = {
  CMD,
  CMD_TEXT,
  NOTION_PAGE_ID_MAP,
  SCENE_IDS,
  IOS_INSTRUCTIONS_LINK,
  ANDROID_INSTRUCTIONS_LINK,
  EMAIL_REGEXP,
  PHONE_REGEXP,
  FREE_PERIOD_MONTH,
  VPN_DB_CONNECTION,
  SECRET_ROW_REGEXP,
  ADMIN_CHAT_ID,
};
