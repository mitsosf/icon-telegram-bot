const config = require('../../config');
const request = require('request');
const bigInt = require('big-integer');

//Initialise mongoose
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {useNewUrlParser: true});
require('../../models/Connection');
const Connection = mongoose.model('connections');


//Monitoring
setInterval(function () {

        Connection.find()
            .then((subscribers) => {
                if (subscribers) {
                    let i =0;
                    subscribers.forEach((subscriber, i)=>
                    {
                        let chatId = subscriber.chatId;
                        let address = subscriber.address;
                        let lastRecordedBalance = subscriber.lastBalance;
                        i++;

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
                                    let balance = new bigInt(cut0xbalance, 16).divide(Math.pow(10, 18 - config.decimalPrecision)); //maintaining floating accuracy of x digits (see config file)

                                    let cut0xLastBalance = lastRecordedBalance.substring(2);
                                    let lastBalance = new bigInt(cut0xLastBalance, 16).divide(Math.pow(10, 18 - config.decimalPrecision)); //maintaining floating accuracy of x digits (see config file)

                                    if (balance.value !== lastBalance.value) {
                                        lastBalance.value = balance.value;
                                        Connection.findOneAndUpdate({chatId: chatId}, {$set: {lastBalance: balanceInHex}}, {new: true}, function (err, doc) {
                                            if (err) {
                                                console.log("Something wrong when updating data!");
                                            } else {
                                                let beautifulBalance = balance.value === 0 ? '0' : balance.toString().substring(0, balance.toString().length - config.decimalPrecision) + config.delimiterSymbol + balance.toString().slice(-config.decimalPrecision);
                                                request({
                                                        url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=Your balance is:\n' + beautifulBalance + ' ICX'
                                                    }
                                                );
                                                console.log('Sent message to chatId: '+ chatId)
                                            }
                                        });
                                    } else {
                                    }
                                }
                            }
                        );
                    });
                }
            });
    },
    config.interval
);