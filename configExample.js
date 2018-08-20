module.exports = {
    telegramBotToken: 'myToken', //Telegram bot unique token, get this from BotFather (https://telegram.me/BotFather)
    mongoURI: 'yourMongoURI', //MongoDB URI
    requestId: 1234,  //You can leave this one as it is
    requestURL: 'https://wallet.icon.foundation/api/v2',  //Leave this one as it is for the main-net
    interval: 30000, //how often do you want to check for a new balance
    decimalPrecision: 2, //Choose how many decimals you want ot see
    delimiterSymbol: ',' //Choose the symbol to separate the integer from the decimal part
};