const config = require('../../config');
const bot = require('../../bot');

//Initialise mongoose
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {useNewUrlParser: true});
require('../../models/Connection');
const Connection = mongoose.model('connections');



//See which address is being monitored
bot.on('/showAddress', (msg) => {

    //Get chatID
    let chatId = msg.chat.id;
    let address;

    Connection.findOne({
        chatId: chatId
    }).then((existingConnection) => {

        if (existingConnection) {
            address = existingConnection.address;
            msg.reply.text('Your address is ' + address);
        }
    });


});
