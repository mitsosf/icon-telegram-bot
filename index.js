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
    msg.reply.text('Welcome to the ICX Balance bot. This bot will let you know when your balance changes in an ICX wallet of yours');
    msg.reply.text('Send the command "/address yourAddress" where yourAddress is your ICX address');
    msg.reply.text('eg. /address hxc4193cda4a75526bf50896ec242d6713bb6b02a3');
});

//Add address
bot.on(/^\/address (.+)$/, (msg, props) => {
    //Get chatID
    chatId = msg.chat.id;

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

bot.connect();

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


                    let cut0x = body.result.response.substring(2);
                    let balance = new bigInt(cut0x, 16).divide(Math.pow(10, 18));

                    if (balance.value === lastBalance.value) {
                        //do nothing
                        lastBalance = balance;
                    }
                    else {
                        lastBalance.value = balance.value;
                        request({
                                url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=Your new balance for the address ' + address + ' is ' + balance + ' ICX'
                            }
                        );
                    }
                }
            )
        }
    },
    interval
);