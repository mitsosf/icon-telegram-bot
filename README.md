# ICON(ICX) Wallet Info Telegram bot
Telegram bot, providing information for an ICON(ICX) wallet.
 
Just experimenting a bit with the ICON RPC API

# Features

- /showBalanceOf hx000... : Shows address balance
- /address hx000... : Set or change address for live updates
- /showAddress : Show currently monitored address

# Installation instructions
**0. Prerequisites:**

- Node.js >= 8.6.0 (tested)
- Telegram

**1. Create telegram bot:**

- Launch [@BotFather](https://telegram.me/BotFather)
- Type `/newBot`, give it a name and a username
- When you're done, note down your bot's HTTP API token and username

**2. Download files:**

```
cd ~
git clone https://github.com/mitsosf/icon-telegram-bot.git
cd icon-telegram-bot
npm install
cp configExample.js config.js
```

**3. Config**

Now edit the config.js file and substitute the value of myToken to the telegram bot HTTP API token you received from @BotFather on the first step

eg. `'telegramBotToken: '658782587:BBWjeuxwakakeoritu_NWJekstikxawjtnm',`

**4. Start the script**

```
node index.js
```

**5. Test it**

Go to [https://telegram.me/bot]() where `bot` is your bot's username (the one you set in @BotFather) and start a chat

eg. `https://telegram.me/sampleBot`

Now all you have to do, is follow the instructions provided by the bot

# Future/New Features:
Still considering, any suggestions appreciated

- Add decimals to the displayed balance
- Track multiple addresses per bot

# ICX tips:
If you found this fun or useful, please consider donating some ICX at:

`hxcca2a68d4a887b40b5872aa81e6ea306be8df01d`

Cheers!

