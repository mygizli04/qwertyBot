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
    switch (message.content.substring(config.prefix.length, endIndex).toLowerCase()) {
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
        case 'plugins':
            minehut.fetchServer("qwerty80").then(server => {
                server.fetchPlugins().then(plugins => {
                    if (plugins.length === 0) {message.channel.send("You have no plugins!"); return}
                    let pluginString = "Plugins (" + plugins.length + "): "
                    plugins.forEach((plugin, index) => {
                        pluginString += plugin.name
                        if (index < plugins.length - 1) pluginString += ", "
                    })
                    message.channel.send(pluginString)
                })
            })
        return
        case 'plugininfo':
            getPluginByName(message.content.substring(message.content.indexOf(" ") + 1)).then(plugin => {
                const embed = new discord.MessageEmbed().setTitle(plugin.name).setDescription(plugin.extendedDescription).addFields(
                    {name: "Cost", value: plugin.credits, inline: true},
                    {name: "Version", value: plugin.version, inline:true}
                )

                pluginInstallCheck(plugin.id).then(result => {
                    let installed = "No"
                    if (result) installed = "Yes"
                    embed.addField("Installed", installed, true)
                    message.channel.send(embed)
                })
            }).catch(err => {
                message.channel.send("Error: " + err)
            })
        return
        case 'installplugin':
            if (!message.member.hasPermission("ADMINISTRATOR")) {message.channel.send("haha, you wish"); return}
            getPluginByName(message.content.substring(message.content.indexOf(" ") + 1)).then(plugin => {
                minehut.fetchServer("qwerty80").then(server => {
                    plugin.install(server).then(() => {
                        message.channel.send("Installed successfully!\n\n(Don't forget, you have to restart for it to take effect!)")
                    })
                })
            })
        return
        case 'uninstallplugin':
            if (!message.member.hasPermission("ADMINISTRATOR")) {message.channel.send("haha, you wish"); return}
            getPluginByName(message.content.substring(message.content.indexOf(" ") + 1)).then(plugin => {
                minehut.fetchServer("qwerty80").then(server => {
                    plugin.remove(server).then(() => {
                        message.channel.send("Uninstalled successfully!\n\n(Don't forget, you have to restart for it to take effect!)")
                    })
                })
            })
        return
        case 'restart':
            if (!message.member.hasPermission("ADMINISTRATOR")) {message.channel.send("haha, you wish"); return}

            minehut.fetchServer("qwerty80").then(server => {
                server.restart().then(res => {
                    message.channel.send("Successfully restarted!")
                }).catch(err => {
                    message.channel.send("Error while restarting server: " + err)
                })
            })
       return
       case 'hibernate':
            if (!message.member.hasPermission("ADMINISTRATOR")) {message.channel.send("haha, you wish"); return}

            minehut.fetchServer("qwerty80").then(server => {

                if (!server.serviceOnline) {
                    message.channel.send("The server is already hibernating!")
                }

                if (server.online) {
                    message.channel.send("The server is still online! Please stop the server before using this command, or go to the minehut panel in order to force hibernate.")
                }
                else {
                    server.hibernate().then(() => {
                        message.channel.send("Successfully hibernated the server.")
                    })
                }
            })
       return
    }
})

async function pluginInstallCheck(id: string) {
    return new Promise<boolean>((resolve, reject) => {
        minehut.fetchServer("qwerty80").then(server => {
            let installed = false
            server.activePlugins.forEach(plugin => {
                if (plugin === id) installed = true
            })
            resolve(installed)
        })
    })
}

async function getPluginById(id: string) {
    return new Promise<minehut.Plugin>((resolve, reject) => {
        minehut.publicPlugins().then(plugins => {
            let ret: minehut.Plugin | undefined

            plugins.forEach(plugin => {
                if (plugin.id === id) {
                    ret = plugin
                }
            })

            if (ret) {
                resolve(ret)
            }
            else {
                reject("Cannot find specified plugin.")
            }
        })
    })
}

async function getPluginByName(name: string) {
    return new Promise<minehut.Plugin>((resolve, reject) => {
        minehut.publicPlugins().then(plugins => {
            let ret: minehut.Plugin | undefined

            plugins.forEach(plugin => {
                if (plugin.name.toLowerCase() === name.toLowerCase()) {
                    ret = plugin
                }
            })

            if (ret) {
                resolve(ret)
            }
            else {
                let closests: Array<minehut.Plugin> = []

                plugins.forEach(plugin => {
                    if (plugin.name.toLowerCase().startsWith(name.toLowerCase())) {
                        closests.push(plugin)
                    }
                })

                if (closests.length === 1) {
                    resolve(closests[0])
                }
                else {
                    reject("More than 1 match")
                }
            }
        })
    })
}

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