require('dotenv').config();
const fs = require('fs');

const USERS_KEY = 'users';

const getConfig = function () {
  let rawdata = undefined;
  try {
    rawdata = fs.readFileSync(process.env.CONFIG_PATH, () => {});
  } catch(err) {
    console.error(`Error reading config file at: ${process.env.CONFIG_PATH}`);
  }
  return rawdata === undefined ? {} : JSON.parse(rawdata);
};

const saveConfig = function (obj) {
  console.log("saveConfig", obj);
  fs.writeFileSync(process.env.CONFIG_PATH, JSON.stringify(obj), err => {
    console.log(err);
  });
};

const addUser = function (username) {
  let config = getConfig();

  if (config[USERS_KEY] == null) {
    config[USERS_KEY] = [];
  }

  let u = config[USERS_KEY].find(u => u.username == username);

  if (u !== undefined) {
    console.warn("user already added");
    return;
  }

  config[USERS_KEY].push({
    username: username,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  saveConfig(config);
};

const removeUser = function (username) {
  const config = getConfig();
  const filtered = config[USERS_KEY].filter(u => u.username != username);
  config[USERS_KEY] = filtered;
  saveConfig(config);
};

const updateUser = function (username) {
  let config = getConfig();

  for (var i in config[USERS_KEY]) {
    if (config[USERS_KEY][i].username == username) {
      config[USERS_KEY][i].updatedAt = new Date();
    }
  }
  saveConfig(config);
}

const getUsers = function () {
  return getConfig()[USERS_KEY] || [];
}

module.exports = {
  addUser,
  removeUser,
  getUsers,
  updateUser
};