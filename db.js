const MongoClient = require('mongodb').MongoClient
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
    if (coll) {
        const result = await coll.countDocuments()
        return result
    } else {
        return 0
    }
}

async function findServer(query, brand, online, version, max) {
    let pipeline = []
    if (query) {
        pipeline.push({
            $search: {
                index: 'motd',
                text: {
                query: query,
                path: {
                    wildcard: '*'
                }
            }},
        })
    }
    if (version && version != "-1") {
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
        const aggCursor = coll.aggregate(pipeline).limit(5)
        let matches = []
        for await (const doc of aggCursor) {
            doc.minecraft.description = doc.minecraft.description.replace("Â", "")
            matches.push(doc)
        }
        return matches
    } else {
        return "server not loaded yet"
    }
}