const express =  require('express');
const fs = require('fs');
const nunjucks = require('nunjucks');
const readline = require('readline');

const app = express();

// set default express engine and extension
app.engine('html', nunjucks.render);
app.set('view engine', 'html');

// configure nunjucks engine
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

let serverData = {
    servers: [],
    count: 0
};

const inStream = fs.createReadStream('servers/log.ndjson');
const rl = readline.createInterface({input: inStream, terminal: false});

rl.on("line", line => {
    let parsedLine = JSON.parse(line);
    if (parsedLine.rec_type === 'banner') {
        serverData.servers.push(parsedLine);
    }
})

rl.on("close", () => {
    serverData.count = serverData.servers.length;
    app.listen(3000, () => {
        console.log(`server started`)
    })
})



app.get('/', (req, res) => {
    console.log(serverData)
    res.render('index', {
        serverData: serverData.toLocaleString()
    })
})

app.get('/search', (req, res) => {
    let query = req.query.query;
    let brand = req.query.brand;
    let online = req.query.online;
    
    let matches = [];
    serverData.servers.forEach(server => {
        if (server.brand === brand && server.online === online) {
            matches.push(server);
        }
    })
})