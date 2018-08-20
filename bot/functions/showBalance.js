const config = require('../../config');
const bot = require('../../bot');
const request = require('request');
const bigInt = require('big-integer');

//Initialise mongoose
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {useNewUrlParser: true});
require('../../models/Connection');
const Connection = mongoose.model('connections');


//Show my balance
bot.on('/showBalance', (msg) => {

    //Get chatID
    let chatId = msg.chat.id;
    let address;

    Connection.findOne({
        chatId: chatId
    }).then((existingConnection) => {
        if (existingConnection) {
            address = existingConnection.address;
            request.post({

                    url: config.requestURL,
                    json: true,
                    body: {
                        "jsonrpc": "2.0",
                        "method": "icx_getBalance",
                        "id": config.requestId,
                        "params": {
                            "address": address
                        }
                    }
                }, (error, response, body) => {

                    if (body != null) {
                        let cut0x = body.result.response.substring(2);
                        let balance = new bigInt(cut0x, 16).divide(Math.pow(10, 18-config.decimalPrecision)); //maintaining floating accuracy of x digits (see config file)

                        let beautifulBalance =  balance.value === 0 ? '0' : balance.toString().substring(0, balance.toString().length-config.decimalPrecision)+ config.delimiterSymbol +balance.toString().slice(-config.decimalPrecision);
                        request({
                                url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=Your balance is:\n' + beautifulBalance + ' ICX'
                            }
                        );

                    }
                }
            );
        }
    });

});