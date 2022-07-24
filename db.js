const MongoClient = require('mongodb').MongoClient
const { response } = require('express')
const pinger = require('minecraft-pinger')
require('dotenv').config()

module.exports = {findServer, serverCount}

let client
let coll

async function connect() {
    client = await MongoClient.connect(process.env.uri, { useNewUrlParser: true, useUnifiedTopology: true })
    coll = client.db('mcscanner').collection('servers')
}

connect()

async function serverCount() {
    const result = await coll.countDocuments()
    return result
}

async function findServer(query, brand, online, version, max) {
    let pipeline = [{
        '$search': {
            'index': 'motd',
            'text': {
            'query': query,
            'path': {
                'wildcard': '*'
            }
        }},
    }]
    if (version != "-1") {
        pipeline.push({
            '$match': {
                'minecraft.version.protocol': parseInt(version)
            }
        })
    }
    if (brand === "modded") {
        pipeline.push({
            '$match': {
                'minecraft.forgeData': {
                    '$exists': true
                }
            }
        })
    }
    if (brand === "vanilla") {
        pipeline.push({
            '$match': {
                'minecraft.forgeData': {
                    '$exists': false
                }
            }
        })
        pipeline.push({
            '$match': {
                'minecraft.modInfo': {
                    '$exists': false
                }
            }
        })
        pipeline.push({
            '$match': {
                'minecraft.modpackData': {
                    '$exists': false
                }
            }
        })
    }
    console.log(JSON.stringify(pipeline))
    if (coll) {
        const aggCursor = coll.aggregate(pipeline)
        let matches = []
        for await (const doc of aggCursor) {
            if (matches.length >= max) {
                return matches
            }
            let ip = doc.ip.split(":")[0]   
            let port = doc.ip.split(":")[1]
            pinger.ping(ip, port, (err, res) => {
                if (!err && matches.length <= max) {
                    if (res.players.online >= online) {
                        res.ip = ip
                        res.port = port
                        res.motd = doc.minecraft.description
                        delete res.description
                        delete res.previewsChat
                        matches.push(res)
                    }
                }
            })
        }
        return matches
    } else {
        return "server not loaded yet"
    }
}