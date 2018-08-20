const config = require('../../config');
const bot = require('../../bot');
const request = require('request');
const bigInt = require('big-integer');

//Initialise mongoose
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {useNewUrlParser: true});
require('../../models/Connection');
const Connection = mongoose.model('connections');



//Set address
bot.on(/^\/address (.+)$/, (msg, props) => {

    //Get chatID
    let chatId = msg.chat.id;
    console.log(chatId)

    let address;
    let lastRecordedBalance;

    Connection.find({
        chatId: chatId
    }).then((existingConnection) => {
        if (existingConnection) {
            //Get Address
            address = props.match[1];

            //Validate address
            let hx = address.substring(0, 2); //Check if address starts with hx

            let hexAddress = address.substring(2); //Get actual hex address substring (without hx)

            let hexOk = /^[0-9a-fA-F]{40}$/i.test(hexAddress);  //Validate if chars are hex and if length is 40

            //Send messages according to validation outcome
            if (hx !== 'hx') {
                msg.reply.text('Your address has to start with hx, eg. hx000000...');
            }
            else if (!hexOk) {
                msg.reply.text('Your address can only have hex chars (0-9, a-f, A-F) and has to be 42 chars long (including the hx in the beginning)');
            }
            else {
                //Successfully set address to monitor

                Connection.findOneAndUpdate({chatId: chatId}, {$set: {address: address}}, {new: true}, function (err, doc) {
                    if (err) {
                        console.log("Something wrong when updating data!");
                    }
                });

                msg.reply.text('Your address is ' + address);
            }

            //Monitoring
            setInterval(function () {

                    Connection.findOne({
                        chatId: chatId
                    }).then((connection) => {
                        if (connection) {
                            chatId = connection.chatId;
                            address = connection.address;
                            lastRecordedBalance = connection.lastBalance;
                        }

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
                                    let balanceInHex = body.result.response;
                                    let cut0xbalance = balanceInHex.substring(2);
                                    let balance = new bigInt(cut0xbalance, 16).divide(Math.pow(10, 18-config.decimalPrecision)); //maintaining floating accuracy of x digits (see config file)

                                    let cut0xLastBalance = lastRecordedBalance.substring(2);
                                    let lastBalance = new bigInt(cut0xLastBalance, 16).divide(Math.pow(10, 18-config.decimalPrecision)); //maintaining floating accuracy of x digits (see config file)

                                    if (balance.value !== lastBalance.value) {
                                        lastBalance.value = balance.value;
                                        Connection.findOneAndUpdate({chatId: chatId}, {$set: {lastBalance: balanceInHex}}, {new: true}, function (err, doc) {
                                            if (err) {
                                                console.log("Something wrong when updating data!");
                                            } else {
                                                let beautifulBalance = balance.value === 0 ? '0' : balance.toString().substring(0, balance.toString().length-config.decimalPrecision)+ config.delimiterSymbol +balance.toString().slice(-config.decimalPrecision);

                                                request({
                                                        url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=Your balance is:\n' + beautifulBalance + ' ICX'
                                                    }
                                                );
                                            }
                                        });
                                    }else {
                                    }
                                }
                            }
                        );
                    });
                },
                config.interval
            );
        }
    });


});