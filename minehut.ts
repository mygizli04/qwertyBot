export let loggedIn = false
import fs = require('fs')
import fetch, {Headers} from "node-fetch"

const loginURL = 'https://authentication-service-prod.superleague.com/v1/user/login/ghost/'
const apiURL = 'https://api.minehut.com'

export async function login() {
    return new Promise<any>((resolve, reject) => {
        if (fs.existsSync('./minehut.har')) {
            parseHar('./minehut.har').then(resolve).catch(reject)
        }
        else {
            reject("No minehut.har detected")
            return
        }
    })
}

let loginInfo: {
    xSlgUser: string
    slgSessionId: string
    xSessionId: string
    authorization: string
    userId: string
    servers: Array<string>
}

async function parseHar(fileLocation: string) {
    return new Promise((resolve, reject) => {
        let harContent = JSON.parse(fs.readFileSync(fileLocation).toString())
        let response: {
            minehutSessionData: {
                _id: string,
                order_servers: [],
                servers: Array<string>,
                sessionId: string,
                sessions: Array<{
                    sessionId: string,
                    created: number
                }>,
                slgSessionId: '',
                slgUserId: '',
                token: string
            },
            slgSessionData: {
                slgRoles: {
                    minehut: {}
                },
                slgSessionId: string,
                slgUserId: string
            }
        }
    
        harContent.log.entries.forEach((value: { request: { url: string; method: string; }; response: { content: { text: string; }; }; }) => {
            if (value.request.url == "https://authentication-service-prod.superleague.com/v1/user/login/ghost" && value.request.method == "POST") {
                try {
                    response = JSON.parse(value.response.content.text)
                }
                catch (err) {
                    console.error("The specified file is corrupted.")
                    return
                }
            }
        })
    
        if (response!) {
            ghostLogin(response.slgSessionData.slgUserId, response.slgSessionData.slgSessionId, response.minehutSessionData.sessionId, response.slgSessionData.slgSessionId).then(resolve).catch(reject)
        }
        else {
            console.error("Required information could not be found in minehut.har")
        }
    })
}

async function ghostLogin(xSlgUser: string, xSlgSession: string, minehutSessionId: string, slgSessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let headers = new Headers()
        headers.set("x-slg-user", xSlgUser)
        headers.set('x-slg-session', xSlgSession)
        headers.set("Content-Type", "application/json")
    
        fetch(loginURL, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({
                minehutSessionId: minehutSessionId,
                slgSessionId: slgSessionId
            })
        }).then(res => res.json()).then(res => {
            if (res.message) {
                reject(res.message)
            }
            else {
                loginInfo = {
                    userId: res.minehutSessionData._id,
                    servers: res.minehutSessionData.servers,
                    authorization: res.minehutSessionData.token,
                    xSessionId: res.minehutSessionData.sessionId,
                    slgSessionId: res.slgSessionData.slgSessionId,
                    xSlgUser: res.slgSessionData.slgUserId
                }
        
                loggedIn = true
                resolve()
            }
        })
    })
}

export async function getFile(serverId: string, path: string) {
    return new Promise<string>((resolve, reject) => {
        fetchAuthorized("/file/" + serverId + '/read/' + path).then(file => {
            if (file.content) {
                resolve(file.content)
            }
            else {
                reject(file)
            }
        })
    })
}

async function fetchAuthorized(endpoint: string, headers?: Headers, method?: string, body?: {}) {
    return new Promise<any>((resolve, reject) => {
        if (!loggedIn) {reject("You are not logged in."); return}

        if (!headers) {
            headers = new Headers()
        }
        headers.set('authorization', loginInfo.authorization)
        headers.set('x-session-id', loginInfo.xSessionId)
        headers.set('content-type', 'application/json')

        if (!method) {
            method = "GET"
        }

        let options: any = {
            method: method,
            headers:headers
        }

        if (!(!body || JSON.stringify(body) === "{}")) {
            options.body = JSON.stringify(body)
        }
    
        fetch(apiURL + endpoint, options).then(res => 
            res.json().then(res => {
            resolve(res)
        }))
    })
}

class OwnedServer {
    id: string
    activePlugins: Array<string>
    activeServerPlan: string
    activeServerPlanDetails: {
        adFree: boolean,
        alwaysOnline: boolean,
        backupSlots: number,
        chargeInterval: number,
        cost: number,
        id: string,
        index: number,
        maxPlayers: number,
        maxPlugins: number,
        planName: string
    }
    backupSlots: number
    categories: Array<string>
    creation: number
    creditsPerDay: number
    exited: boolean
    hibernationPrepStartTime: number
    installedContentPacks: []
    lastOnline: number
    maxPlayers: number
    maxRam: number
    metrics: {}
    motd: string
    name: string
    lowerName: string
    online: boolean
    owner: string
    platform: string
    playerCount: number
    players: []
    port: number
    purchasedIcons: []
    purchasedPlugins: []
    serverIp: string
    serverPlan: string
    serverPlanDetails: {
        adFree: boolean,
        alwaysOnline: boolean,
        backupSlots: number,
        chargeInterval: number,
        cost: number,
        id: string,
        index: number,
        maxPlayers: number,
        maxPlugins: number,
        planName: string
    }
    serverPort: number
    serverProperites: {
        allow_flight: boolean,
        allow_nether: boolean,
        announce_player_achievements: boolean,
        difficulty: number,
        enable_command_block: boolean,
        force_gamemode: boolean,
        gamemode: number,
        generate_structures: boolean,
        generator_settings: string,
        hardcore: boolean,
        level_name: string,
        level_seed: string,
        level_type: string,
        max_players: number,
        pvp: boolean,
        resource_pack: string,
        resource_pack_sha1: string,
        spawn_animals: boolean,
        spawn_mobs: boolean,
        spawn_protection: number,
        view_distance: number
    }
    serviceOnline: boolean
    shutdownReason: string
    shutdownScheduled: boolean
    startedAt: number
    starting: boolean
    status: string
    stoppedAt: number
    stopping: boolean
    storageNode: string
    suspended: boolean
    timeNoPlayers: number
    visiblity: boolean

    constructor (server: any) {
        this.id = server._id
        this.activePlugins = server.active_plugins
        this.activeServerPlan = server.active_server_plan
        this.activeServerPlanDetails = server.active_server_plan_detials
        this.backupSlots = server.backup_slots
        this.categories = server.categories
        this.creation = server.creation
        this.creditsPerDay = server.credits_per_day
        this.exited = server.exited
        this.hibernationPrepStartTime = server.hibernation_prep_start_time
        this.installedContentPacks = server.installed_content_packs
        this.lastOnline = server.last_online
        this.maxPlayers = server.max_players
        this.maxRam = server.max_ram
        this.metrics = server.metrics
        this.motd = server.motd
        this.name = server.name
        this.lowerName = server.name_lower
        this.online = server.online
        this.owner = server.owner
        this.platform = server.platform
        this.playerCount = server.player_count
        this.players = server.players
        this.port = server.port
        this.purchasedIcons = server.purchased_icons
        this.purchasedPlugins = server.purchased_plugins
        this.serverIp = server.server_ip
        this.serverPlan = server.server_plan
        this.serverPlanDetails = server.server_plan_details
        this.serverPort = server.server_port
        this.serverProperites = server.server_properties
        this.serviceOnline = server.service_online
        this.shutdownReason = server.shutdown_reason
        this.shutdownScheduled = server.shutdown_scheduled
        this.startedAt = server.started_at
        this.starting = server.starting
        this.status = server.status
        this.stoppedAt = server.stopped_at
        this.stopping = server.stopping
        this.storageNode = server.storage_node
        this.suspended = server.suspended
        this.timeNoPlayers = server.time_no_players
        this.visiblity = server.visibility
    }

    start() {
        return activateServer(this)
    }

    sendCommand(command: string) {
        return sendCommand(this.id, command)
    }

    getFile(path: string) {
        return getFile(this.id, path)
    }

    async fetchPlugins() {
        return new Promise<Array<Plugin>>((resolve, reject) => {
            let retPlugins: Array<Plugin> = []
            this.activePlugins.forEach((activePlugin, activeIndex, activeArray) => {
                publicPlugins().then(plugins => {
                    plugins.forEach((plugin, pluginIndex, pluginArray) => {
                       if (plugin.id === activePlugin) {
                            retPlugins.push(plugin)
                       }

                       if (retPlugins.length === this.activePlugins.length) {
                        resolve(retPlugins)
                       }
                    })
                })
            })
        })
    }

    installPlugin(plugin: string | Plugin) {
        if (typeof plugin === "string") {
            return installPlugin(this.id, plugin)
        }
        else {
            return installPlugin(this.id, plugin.id)
        }
    }

    restart() {
        return restartServer(this.id)
    }

    hibernate() {
        return hibernateServer(this.id)
    }
}

export async function hibernateServer(serverId: string) {
    return new Promise<void>((resolve, reject) => {
        fetchAuthorized('/server/' + serverId + '/destroy_service', undefined, 'POST').then(res => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
            }
        })
    })
}

export async function restartServer(serverId: string) {
    return new Promise<void>((resolve, reject) => {
        fetchAuthorized('/server/' + serverId + '/restart', undefined, 'POST').then(res => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
            }
        })
    })
}

export function installPlugin(serverId: string, plugin: string) {
    return new Promise<void>((resolve, reject) => {
        fetchAuthorized('/server/' + serverId + '/install_plugin', undefined, 'POST', {plugin: plugin}).then((res: {}) => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
            }
        })
    })
}

export function removePlugin(serverId: string, plugin: string) {
    return new Promise<void>((resolve, reject) => {
        fetchAuthorized('/server/' + serverId + '/remove_plugin', undefined, 'POST', {plugin: plugin}).then((res: {}) => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
            }
        })
    })
}

export class Plugin {
    id: string
    configFileName: string
    created: number
    credits: number
    description: string
    extendedDescription: string
    disabled: boolean
    fileName: string
    htmlDescriptionExtended: string
    lastUpdated: number
    name: string
    platform: string
    version: string
    __v: number //No idea what this one does

    constructor (plugin: {
        _id: string,
        config_file_name: string,
        created: number,
        credits: number,
        desc: string,
        desc_extended: string,
        disabled: boolean,
        file_name: string,
        html_desc_extended: string,
        last_updated: number,
        name: string,
        platform: string,
        version: string,
        __v: number
    }) {
        this.id = plugin._id
        this.configFileName = plugin.config_file_name
        this.created = plugin.created
        this.credits = plugin.credits
        this.description = plugin.desc
        this.extendedDescription = plugin.desc_extended
        this.disabled = plugin.disabled
        this.fileName = plugin.file_name
        this.htmlDescriptionExtended = plugin.html_desc_extended
        this.lastUpdated = plugin.last_updated
        this.name = plugin.name
        this.platform = plugin.platform
        this.version = plugin.version
        this.__v = plugin.__v
    }

    install(server: string | OwnedServer) {
        if (typeof server != 'string') server = server.id
        return installPlugin(server, this.id)
    }

    remove(server: string | OwnedServer) {
        if (typeof server != 'string') server = server.id
        return removePlugin(server, this.id)
    }
}

export async function publicPlugins() {
    return new Promise<Array<Plugin>>((resolve, reject) => {
        fetch(apiURL + '/plugins_public').then(res => res.json().then(plugins => {
            if (plugins.all) {
                let ret: Array<Plugin> = []
                plugins.all.forEach((plugin: any) => {
                    ret.push(new Plugin(plugin))
                })
                resolve(ret)
            }
            else {
                reject(plugins)
            }
        }))
    })
}

export async function sendCommand(serverId: string, command: string) {
    return new Promise<void>((resolve, reject) => {
        fetchAuthorized('/server/' + serverId + '/send_command', undefined, 'POST', {command: command}).then(res => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
            }
        })
    })
}

async function startService(server: string) {
    return new Promise<void>((resolve, reject) => {
        fetchAuthorized('/server/' + server + '/start_service', undefined, 'POST').then(res => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
            }
        })
    })
}

async function startServer(server: string) {
    return new Promise<void>((resolve, reject) => {
        fetchAuthorized('/server/' + server + '/start', undefined, 'POST').then(res => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
            }
        })
    })
}

export async function activateServer(server: string | OwnedServer) {
    return new Promise<void>(async (resolve, reject) => {
        if (typeof server === "string") {
            server = await fetchServer(server)
        }
    
        if (server.online) {
            reject("The server is already online!")
        }
        else if (server.serviceOnline) {
            startServer(server.id).then(resolve)
        }
        else {
            startService(server.id).then(resolve)
        }
    })
}

export async function fetchServer(name: string) { 
    return new Promise<OwnedServer>((resolve, reject) => {
        if (!loggedIn) {reject("You are not logged in!"); return}
        fetchAuthorized('/servers/' + loginInfo.userId + '/all_data').then(servers => {
            let selectedServer
            servers.forEach((server: any) => {
                if (server.name === name) {
                    selectedServer = server
                }
            })

            if (selectedServer) {
                resolve(new OwnedServer(selectedServer))
            }
            else {
                reject("You do not own a server called " + name)
            }
        })
    })
}