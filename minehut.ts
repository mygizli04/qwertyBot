export let loggedIn = false
import fs = require('fs')
import fetch, {Headers} from "node-fetch"

const loginURL = 'https://authentication-service-prod.superleague.com/v1/user/login/ghost/'
const apiURL = 'https://api.minehut.com'

export async function login() {
    return new Promise<void>((resolve, reject) => {
        if (fs.existsSync('./minehut.har')) {
            parseHar('./minehut.har')
        }
        else {
            reject("No minehut.har detected")
            return
        }

        let interval = setInterval(() => {
            if (loggedIn) {
                resolve()
                clearInterval(interval)
            }
        }, 1000)
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

function parseHar(fileLocation: string) {
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
        ghostLogin(response.slgSessionData.slgUserId, response.slgSessionData.slgSessionId, response.minehutSessionData.sessionId, response.slgSessionData.slgSessionId)
    }
    else {
        console.error("Required information could not be found in minehut.har")
    }
}

function ghostLogin(xSlgUser: string, xSlgSession: string, minehutSessionId: string, slgSessionId: string) {
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
        loginInfo = {
            userId: res.minehutSessionData._id,
            servers: res.minehutSessionData.servers,
            authorization: res.minehutSessionData.token,
            xSessionId: res.minehutSessionData.sessionId,
            slgSessionId: res.slgSessionData.slgSessionId,
            xSlgUser: res.slgSessionData.slgUserId
        }

        loggedIn = true
        console.log("Logged into minehut!")
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
    
        fetch(apiURL + endpoint, options).then(res => res.json().then(res => {
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