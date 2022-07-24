const express =  require('express')
const fs = require('fs')
const nunjucks = require('nunjucks')
const readline = require('readline')
const utf8 = require('utf8')

const app = express()

// set default express engine and extension
app.engine('html', nunjucks.render)
app.set('view engine', 'html')

// configure nunjucks engine
nunjucks.configure('views', {
    autoescape: true,
    express: app
})

let serverData = {
    servers: [],
    count: 0
}

const inStream = fs.createReadStream('servers/log.ndjson')
const rl = readline.createInterface({input: inStream, terminal: false})

rl.on("line", line => {
    let parsedLine = JSON.parse(line)
    if (parsedLine.rec_type === 'banner') {
        serverData.servers.push(parsedLine)
    }
})

rl.on("close", () => {
    serverData.count = serverData.servers.length.toLocaleString()
    app.listen(3000, () => {
        console.log(`server started`)
    })
})



app.get('/', (req, res) => {
    res.render('index', {
        serverData: serverData
    })
})

app.get('/search', (req, res) => {
    let query = req.query.query
    let brand = req.query.brand
    let online = req.query.online

    
    let matches = []
    serverData.servers.forEach(server => {
        if (matches.length >= 10) {
            return
        }
        try {
            let banner = JSON.parse(server.data.banner)
            let description
            if (banner.description.extra) {
                banner.description.extra.forEach(extra => {
                    description = ""
                    description += extra.text
                })
            } else if (banner.description.text) {
                description = banner.description.text
            } else {
                description = banner.description
            }
            if (description.toLowerCase().startsWith(query.toLowerCase()) && banner.players.online >= online) {
                if (brand == "all") {
                    matches.push(server)
                } else if (brand == "vanilla" && !banner.hasOwnproperty('forgeData')) {
                    matches.push(server)
                } else if (brand == "forge" && banner.hasOwnproperty('forgeData')) {
                    matches.push(server)
                }
            }
        } catch (e) {
            console.log(e)
        }
    })
    // get last 10 objects of matches
    matches = matches.slice(0, 10)
    res.send(matches)
})