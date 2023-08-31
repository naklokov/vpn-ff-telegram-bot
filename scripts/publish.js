require("dotenv").config();
const { exec } = require("child_process");
const { SSH_LOGIN, SSH_URL } = process.env;

const DIST_FOLDER = ".";

const copyCmd = exec(
  `rsync -av --exclude 'node_modules' --exclude .env ${DIST_FOLDER} ${SSH_LOGIN}@${SSH_URL}:/home/naklokov/vpn-bot`
);
copyCmd.stdout.on("data", (data) => console.log(data.toString()));
