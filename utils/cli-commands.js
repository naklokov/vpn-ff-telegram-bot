const { execSync } = require("child_process");

const { SUDO_PASSWORD, WITHOUT_CLI } = process.env;

const execSudo = (command) => {
  const sudoCommand = `echo "${SUDO_PASSWORD}" | sudo -S "${command}"`;
  execSync(sudoCommand);
};

const restartService = () => {
  if (!WITHOUT_CLI) {
    execSudo("ipsec secrets");
  }
};

module.exports = { restartService };
