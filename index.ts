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
import minehut = require('./minehut.js')

minehut.login().then(() => {
    minehut.fetchServer("qwerty80")
})

const client = new discord.Client()

client.on('ready', () => {
    console.log("Bot's ready!")
})

client.on('message', message => {
    if (message.author.bot) return
    if (!message.member) return
    if (!message.content.startsWith(config.prefix)) return
    let endIndex = 0
    if (message.content.includes(" ")) {
        endIndex = message.content.indexOf(" ")
    }
    else {
        endIndex = message.content.length
    }
    switch (message.content.substring(config.prefix.length, endIndex)) {
        case 'ping':
            message.reply("Pong!")
        return
        case 'status':
            minehut.fetchServer("qwerty80").then(server => {
                if (server.online) {
                    switch (server.playerCount) {
                        case 0:
                            message.channel.send("The server is online with no one playing! Why not be the first to join?")
                        break
                        case 1:
                            message.channel.send("The server is online with one person playing! They must be so alone :(")
                        break
                        default:
                            message.channel.send("The server is online with " + server.playerCount + " people playing!")
                    }
                }
                else if (server.serviceOnline) {
                    switch (server.status) {
                        case 'STARTING':
                            message.channel.send("The server is starting...")
                        break
                        case 'STOPPING':
                            message.channel.send("The server is stopping...")
                        break
                        case 'OFFLINE':
                            message.channel.send("The server is offline (Not hibernating)")
                        break
                        default:
                            message.channel.send("The server is currently not online. (Not hibernating)")
                    }
                }
                else {
                    message.channel.send("The server is hibernating.")
                }
            })
        return
        case 'start':
            message.channel.send("Starting the server, please wait..")
            minehut.activateServer("qwerty80").then(() => {
                message.channel.send("The server is now starting..")
            }).catch(err => {
                if (err === "The server is already online!") {
                    message.channel.send("The server failed to start because it's already online!")
                } else {
                    throw err
                }
            })
        return
        case 'command':
            if (!message.member.hasPermission("ADMINISTRATOR")) {message.channel.send("haha, you wish"); return}
            minehut.fetchServer("qwerty80").then(server => {
                if (!server.online) {message.channel.send("The server is offline!"); return}

                minehut.sendCommand("5edd7985984fbb006f4f37d7", message.content.substring(config.prefix.length + 8)).then(() => {
                    message.channel.send("Command sent successfully.")
                    let msg = "```\n"
                    minehut.getFile("5edd7985984fbb006f4f37d7", "/logs/latest.log").then(log => {
                        msg += getLastLines(log, 6)
                        msg += "\n```\n"
                        
                        switch (rand(1,5)) {
                            case 1:
                                msg += "Here's a cookie! 🍪"
                            break
                            case 2:
                                msg += "High five! 🙋‍♂️"
                            break
                            case 3:
                                msg += "‿︵‿︵‿ 👋"
                            break
                            case 4:
                                msg += "Have some logs! 📰🪵"
                            break
                            case 5:
                                msg += "(sbeve says hi!)"
                            break
                        }
    
                        message.channel.send(msg)
                    })
                })
            })
        return
    }
})

function rand(min: number, max: number) {
    return Math.round(Math.random() * (max-min) + min)
}

function getLastLines(text: string, index: number) {
    let ret = ""
    let lines = text.split("\n")
    lines = lines.filter(value => !!(value.trim()))
    lines.forEach((line, inde, array) => {
        if ((array.length - inde) <= index) {
            ret += line + "\n"
        }
    })
    return ret
}

client.login(botToken)