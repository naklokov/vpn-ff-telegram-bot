#### Installation steps

1. clone this repo
2. run `npm install`
3. Create your bot in http://t.me/BotFather
4. Run `vpn-ff-server` and get API token
5. Create .env file in main directory

```
# your personal telegrambot token
BOT_TOKEN=[TELEGRAM_BOT_TOKEN]
# vpn-ff-server URL
VPN_SERVER_URL="http://127.0.0.1:3000"
# vpn-ff-server x-api-token
VPN_SERVER_API_TOKEN="your-api-token"
# your contact
DEVELOPER_CONTACT="@your"
# file path to secrets file
SECRETS_FILE_PATH="/etc/ipsec.secrets"
# your ssh server password for publish
SUDO_PASSWORD="password"
# your ssh server url for publish
SSH_URL="8.8.8.8"
# your ssh server login for publish
SSH_LOGIN="login"
```

6. run bot `npm start`

#### Bot commands

- start - information about bot works
- info - working conditions
- registration - new user registration process
- status - registered user connection status
- help - help information
