const config = require('./config');
const TeleBot = require('telebot');
const bot = new TeleBot(config.telegramBotToken);
const request = require('request');
const bigInt = require('big-integer');

//Initialise mongoose
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {useNewUrlParser: true});
require('./models/Connection');
const Connection = mongoose.model('connections');

//Global Variables
let chatId = '0'; //Unique chat ID
let address = 'hx0000000000000000000000000000000000000000'; //Set address for monitoring
const interval = config.interval;  //Time between balance updates

//Welcome message
bot.on('/start', (msg) => {

    //Get chatID
    chatId = msg.chat.id;
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

//See address balance
bot.on(/^\/showBalanceOf (.+)$/, (msg, props) => {
    //Get Address
    let tempAddress = props.match[1];

    //Validate address
    let hx = tempAddress.substring(0, 2); //Check if address starts with hx

    let hexAddress = tempAddress.substring(2); //Get actual hex address substring (without hx)

    let hexOk = /^[0-9a-fA-F]{40}$/i.test(hexAddress);  //Validate if chars are hex and if length is 40

    //Send messages according to validation outcome
    if (hx !== 'hx') {
        msg.reply.text('The address has to start with hx, eg. hx000000...');
    }
    else if (!hexOk) {
        msg.reply.text('The address can only have hex chars (0-9, a-f, A-F) and has to be 42 chars long (including the hx in the beginning)');
    }
    else {
        //Successfully picked an address
        request.post({

                url: config.requestURL,
                json: true,
                body: {
                    "jsonrpc": "2.0",
                    "method": "icx_getBalance",
                    "id": config.requestId,
                    "params": {
                        "address": tempAddress
                    }
                }
            }, (error, response, body) => {

                if (body != null) {
                    let cut0x = body.result.response.substring(2);
                    let balance = new bigInt(cut0x, 16).divide(Math.pow(10, 18));

                    request({
                            url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=The balance of ' + tempAddress + ' is ' + balance + ' ICX'
                        }
                    );

                }
            }
        )

    }
});

//Set address
bot.on(/^\/address (.+)$/, (msg, props) => {

    //Get chatID
    chatId = msg.chat.id;
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
                                    let balance = new bigInt(cut0xbalance, 16).divide(Math.pow(10, 18-config.decimalPrecision)); //maintaining floating accuracy of 2 digits
                                    //console.log('Current balance: ' + balance);


                                    let cut0xLastBalance = lastRecordedBalance.substring(2);
                                    let lastBalance = new bigInt(cut0xLastBalance, 16).divide(Math.pow(10, 18-config.decimalPrecision)); //maintaining floating accuracy of 2 digits
                                    //console.log('Last balance: ' + lastBalance);


                                    if (balance.value !== lastBalance.value) {
                                        lastBalance.value = balance.value;
                                        Connection.findOneAndUpdate({chatId: chatId}, {$set: {lastBalance: balanceInHex}}, {new: true}, function (err, doc) {
                                            if (err) {
                                                console.log("Something wrong when updating data!");
                                            } else {
                                                let beautifulBalance = balance.toString().substring(0, balance.toString().length-config.decimalPrecision)+ config.delimiterSymbol +balance.toString().slice(-config.decimalPrecision);

                                                request({
                                                        url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=Your balance is:\n' + beautifulBalance + ' ICX'
                                                    }
                                                );
                                            }
                                        });
                                    }else {
                                        console.log('test')
                                    }
                                }
                            }
                        );
                    });
                },
                interval
            );
        }
    });


});

//See which address is being monitored
bot.on('/showAddress', (msg) => {

    //Get chatID
    chatId = msg.chat.id;
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

//Show my balance
bot.on('/showBalance', (msg) => {

    //Get chatID
    chatId = msg.chat.id;
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
                        let balance = new bigInt(cut0x, 16).divide(Math.pow(10, 18));

                        request({
                                url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=Your balance is:\n' + balance + ' ICX'
                            }
                        );

                    }
                }
            );
        }
    });

});

bot.on('/help', (msg) => {
    msg.reply.text('Welcome to the ICX Telegram bot. This bot will let you know when the balance changes in your ICX wallet (live updates)\n\nSend the command "/address yourAddress", where yourAddress is your ICX address\n\neg. /address hxc4193cda4a75526bf50896ec242d6713bb6b02a3\n\nList of commands:\n/showBalanceOf 0x000... : Show address balance\n/address hx000... : Set or change address for live updates\n/showAddress : Show currently monitored address\n/showBalance : Show balance of currently monitored address\n');
});

bot.connect();