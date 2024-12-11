FROM node:16

WORKDIR /usr/app

COPY ./ ./

RUN git clone https://github.com/naklokov/vpn-ff-telegram-bot.git
RUN cd vpn-ff-telegram-bot
RUN npm install

RUN npm install pm2 -g

CMD ["pm2", "start", "index.js"]