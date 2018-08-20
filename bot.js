const config = require('./config');
const TeleBot = require('telebot');

const bot = module.exports = new TeleBot(config.telegramBotToken);

require('./bot/functions/start');

require('./bot/functions/help');

require('./bot/functions/showBalanceOf');

require('./bot/functions/address');

require('./bot/functions/showAddress');

require('./bot/functions/showBalance');

bot.connect();
