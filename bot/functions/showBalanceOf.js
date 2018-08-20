const config = require('../../config');
const bot = require('../../bot');
const request = require('request');
const bigInt = require('big-integer');

//See address balance
bot.on(/^\/showBalanceOf (.+)$/, (msg, props) => {

    //Get chatID
    let chatId = msg.chat.id;

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

                    let beautifulBalance = balance.value === 0 ? '0' : balance.toString().substring(0, balance.toString().length-config.decimalPrecision)+ config.delimiterSymbol +balance.toString().slice(-config.decimalPrecision);
                    let beautifulTempAddress = tempAddress.substring(0,6) + '...' + tempAddress.substring(37,41);

                    request({
                            url: 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage?chat_id=' + chatId + '&text=The balance of ' + beautifulTempAddress + ' is:\n ' + beautifulBalance + ' ICX'
                        }
                    );

                }
            }
        )

    }
});