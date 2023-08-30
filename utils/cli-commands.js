const { execSync } = require("child_process");

const { SUDO_PASSWORD } = process.env;

const execSudo = (command) => {
  const sudoCommand = `echo "${SUDO_PASSWORD}" | sudo -S "${command}"`;
  execSync(sudoCommand);
};

const restartService = () => execSudo("ipsec secrets");

module.exports = { restartService };
