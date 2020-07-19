const bot = require('../../bot');

bot.on('/help', (msg) => {
    msg.reply.text('Welcome to the ICX Telegram bot. This bot will let you know when the balance changes in your ICX wallet (live updates)\n\nSend the command "/address yourAddress", where yourAddress is your ICX address\n\neg. /address hxc4193cda4a75526bf50896ec242d6713bb6b02a3\n\nList of commands:\n/showBalanceOf 0x000... : Show address balance\n/address hx000... : Set or change address for live updates\n/showAddress : Show currently monitored address\n/showBalance : Show balance of currently monitored address\n');
});