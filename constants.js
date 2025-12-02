const USERS_TEXT = {
  hidden: "(^_^)",
  goToMain: "На главную",
  mainMenu: "🏠 Главная страница",
  exitScene: "Выйти в меню",
  selectActions: "Выберите действиe: ",
  pay: "💰 Оплата",
  info: "ℹ️ Тарифы и условия",
  instructions: "📖 Настройка VPN",
  referral: "🎁 Бонусная программа",
  status: "❔ Статус подключения",
  help: "🆘 Помощь",
  registration: "📝 Регистрация",

  // админские действия
  extend: "Продлить",
  migrateToSlave: "Миграция на новый сервер",
  checkUser: "Информация о пользователе",
  rupor: "Сообщение всем",
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
  pay: "pay",
  migrateToSlave: "migrateToSlave",
  checkUser: "checkUser",
  rupor: "rupor",
  exit: "exit",
};

const CALLBACK_QUERY_DATA = {
  instructionsVless: "instructions_vless",
  instructionsIpsec: "instructions_ipsec",
  instructionsIosVless: "instructions_ios_vless",
  instructionsAndroidVless: "instructions_android_vless",
  instructionsWindowsVless: "instructions_windows_vless",
  instructionsKeeneticVless: "instructions_keenetic_vless",
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
  MIGRATE_TO_SLAVE: "MIGRATE_TO_SLAVE",
  CHECK_USER: "CHECK_USER",
  RUPOR: "RUPOR",
  PAY: "PAY",
};

const EMAIL_REGEXP =
  // eslint-disable-next-line no-useless-escape
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

const PHONE_REGEXP = /^7[0-9]{10}$/i;

const FREE_PERIOD_DAYS = 7;

const SECRET_ROW_REGEXP = /^(.+) : EAP "(.+)"$/i;

const VPN_DB_CONNECTION = process.env.MONGO_URL + "vpn";

const DEVELOPER_CONTACT = "@naklokov";

const CALLBACK_QUERY_DATA_DELIMETER = ":";

const REMNAWAVE_PREFIX = "REMNAWAVE";

module.exports = {
  CMD,
  USERS_TEXT,
  REMNAWAVE_PREFIX,
  DEVELOPER_CONTACT,
  NOTION_PAGE_ID_MAP,
  SCENE_IDS,
  EMAIL_REGEXP,
  PHONE_REGEXP,
  FREE_PERIOD_DAYS,
  VPN_DB_CONNECTION,
  SECRET_ROW_REGEXP,
  ADMIN_CHAT_ID,
  CALLBACK_QUERY_DATA,
  CALLBACK_QUERY_DATA_DELIMETER,
};
