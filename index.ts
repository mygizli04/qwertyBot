import fs = require('fs')

if (!fs.existsSync('./config.json')) {
    fs.writeFileSync('./config.json', JSON.stringify({
        storageType: "config", //If "env", botToken env variable will be read instead
        botToken: "00000000000000000000000000000000000000000000000000000000000",
        prefix: "!"
    }, null, "\t"))
    process.exit(1)
}

import config from './config.json'

let botToken: string

if (config.storageType === "env") {
    botToken = process.env.botToken! // deepscan-disable-line UNUSED_VAR_ASSIGN
}
else if (config.storageType === "config") {
    botToken = config.botToken // deepscan-disable-line UNUSED_VAR_ASSIGN
}
else {
    console.error("Invalid bot token")
    process.exit(1)
}

import * as discord from 'discord.js'

const client = new discord.Client()

client.on('ready', () => {
    console.log("Bot's ready!")
})

client.on('message', message => {
    if (message.author.bot) return
    if (!message.member) return
    if (!message.content.startsWith(config.prefix)) return
    switch (message.content.substring(config.prefix.length,message.content.indexOf(" "))) {
        case 'ping':
            message.reply("Pong!")
        return

    }
})

client.login(botToken)