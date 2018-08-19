const config = require('./config');
const TeleBot = require('telebot');
const bot = new TeleBot(config.telegramBotToken);
const request = require('request');
const bigInt = require('big-integer');

//Global Variables
let chatId = '0'; //Unique chat ID
let address = 'hx0000000000000000000000000000000000000000'; //Set address for monitoring
const interval = config.interval;  //Time between balance updates

//Welcome message
bot.on('/start', (msg) => {
    //Get chatID
    chatId = msg.chat.id;

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

    //Get Address
    let tempAddress = props.match[1];

    //Validate address
    let hx = tempAddress.substring(0, 2); //Check if address starts with hx

    let hexAddress = tempAddress.substring(2); //Get actual hex address substring (without hx)

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
        msg.reply.text('Your address is ' + tempAddress);
        address = tempAddress;
    }
});

//See which address is being monitored
bot.on('/showAddress', (msg) => {
    msg.reply.text('Your address is ' + address);
});

bot.on('/help', (msg) => {
    msg.reply.text('Welcome to the ICX Telegram bot. This bot will let you know when the balance changes in your ICX wallet (live updates)\n\nSend the command "/address yourAddress", where yourAddress is your ICX address\n\neg. /address hxc4193cda4a75526bf50896ec242d6713bb6b02a3\n\nList of commands:\n/showBalanceOf 0x000... : Show address balance\n/address hx000... : Set or change address for live updates\n/showAddress : Show currently monitored address\n');
});

bot.connect();


//Monitoring
let lastBalance = new bigInt(0);
setInterval(function () {
        if (chatId !== '0' && address !== 'hx0000000000000000000000000000000000000000') {
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

                        if (balance.value === lastBalance.value) {
                            //do nothing
                            lastBalance = balance;
                        }
                        else {
                            lastBalance.value = balance.value;
                            request({
                                    url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=The balance of ' + address + ' is ' + balance + ' ICX'
                                }
                            );
                        }
                        console.log(lastBalance)
                    }
                }
            )
        }
    },
    interval
);