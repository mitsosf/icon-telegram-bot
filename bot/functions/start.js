const config = require('../../config');

//Initialise mongoose
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {useNewUrlParser: true});
require('../..//models/Connection');
const Connection = mongoose.model('connections');
const bot = require('../../bot');

//Welcome message
bot.on('/start', (msg) => {

    //Get chatID
    let chatId = msg.chat.id;

    //Check if user is already registered
    Connection.findOne({
        chatId: chatId
    }).then((existingConnection) => {
        if (!existingConnection) {
            //If the connection doesn't exist, create new entry
            let username = msg.from.username;
            new Connection({
                chatId: chatId,
                username: username,
                address: 'hx0000000000000000000000000000000000000000',
                lastBalance: '0x0'
            }).save();
        }
    });

    msg.reply.text('Welcome to the ICX Telegram bot. This bot will let you know when the balance changes in your ICX wallet (live updates)\n\nSend the command "/address yourAddress", where yourAddress is your ICX address\n\neg. /address hxc4193cda4a75526bf50896ec242d6713bb6b02a3\n\nFor help, type "/help"');
});