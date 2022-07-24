const express =  require('express')
const fs = require('fs')
const nunjucks = require('nunjucks')
const readline = require('readline')
const db = require('./db')

const app = express()

// set default express engine and extension
app.engine('html', nunjucks.render)
app.set('view engine', 'html')

// configure nunjucks engine
nunjucks.configure('views', {
    autoescape: true,
    express: app
})

app.get('/', async (req, res) => {
    let serverCount = await db.serverCount()
    res.render('index', {
        serverCount: serverCount
    })
})

app.get('/search', async (req, res) => {
    let query = req.query.query
    let brand = req.query.brand
    let online = req.query.online
    let version = req.query.version
    let matches = await db.findServer(query, brand, online, version, 5)
    res.send(matches)
})

app.listen(3000, () => {
    console.log(`server started`)
})