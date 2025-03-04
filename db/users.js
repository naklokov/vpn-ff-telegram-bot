const mongoose = require("mongoose");
const {
  getExpiredDateIso,
  getRegistrationDateIso,
} = require("../utils/common");
const { VPN_DB_CONNECTION } = require("../constants");

const logger = require("../utils/logger");

const userScheme = new mongoose.Schema({
  chatId: { type: Number },
  name: String,
  phone: { type: String, required: true },
  email: String,
  registrationDate: {
    type: String,
    default: getRegistrationDateIso,
    required: true,
  },
  expiredDate: {
    type: String,
    default: getExpiredDateIso,
  },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isVless: { type: Boolean, default: true },
  referralUserLogin: { type: String },
});

const User = mongoose.model("User", userScheme);

const addUser = async (user) => {
  const newUser = new User(user);
  try {
    await mongoose.connect(VPN_DB_CONNECTION);
    await newUser.save();
    logger.info(`Пользователь добавлен в БД ${user.phone}`);
  } catch (error) {
    logger.info(
      `Произошла ошибка при добавлении пользователя в БД ${user.phone}: ${error}`,
    );
    throw error;
  }
};

const getUsers = async () => {
  try {
    await mongoose.connect(VPN_DB_CONNECTION);
    const users = User.find({});
    return users;
  } catch (error) {
    logger.error(`Произошла ошибка при получении пользователей из БД`);
    throw Error(error);
  }
};

const getUserByChatId = async (chatId) => {
  try {
    await mongoose.connect(VPN_DB_CONNECTION);
    const user = User.findOne({ chatId });
    return user;
  } catch (error) {
    logger.error(
      `Произошла ошибка при получении пользователя по chatId ${chatId}`,
    );
    throw Error(error);
  }
};

const getUserByPhone = async (phone) => {
  try {
    await mongoose.connect(VPN_DB_CONNECTION);
    const user = User.findOne({ phone });
    return user;
  } catch (error) {
    logger.error(
      `Произошла ошибка при получении пользователя по телефону ${phone}`,
    );
    throw Error(error);
  }
};

const deleteUser = async (userId) => {
  try {
    await mongoose.connect(VPN_DB_CONNECTION);
    await User.deleteOne({ id: userId });
  } catch (error) {
    logger.error(
      `Произошла ошибка при удалении пользователя по телефону ${userId}`,
    );
    throw Error(error);
  }
};

const updateUserById = async (userId, user) => {
  try {
    await mongoose.connect(VPN_DB_CONNECTION);
    await User.updateOne({ id: userId }, { ...user });
  } catch (error) {
    logger.error(
      `Произошла ошибка при обновлении пользователя по id ${userId}`,
    );
    throw Error(error);
  }
};

const updateUserByPhone = async (phone, user) => {
  try {
    await mongoose.connect(VPN_DB_CONNECTION);
    await User.updateOne({ phone }, { ...user });
  } catch (error) {
    logger.error(
      `Произошла ошибка при обновлении пользователя по телефону ${phone}`,
    );
    throw Error(error);
  }
};

module.exports = {
  addUser,
  deleteUser,
  updateUserById,
  updateUserByPhone,
  getUsers,
  getUserByChatId,
  getUserByPhone,
};
