const http = require('http');
const fs = require('fs');
const fsProm = require('fs').promises;

const PORT = process.env.PORT;
console.log(process)

//const list = JSON.parse(fs.readFileSync('./list.json', 'utf8'));

const writeFile = async (newData) => {
    try {
        await fsProm.writeFile('./list.json', newData);
        console.log('List is updated.')
    } catch (error) {
        console.error(err);
    }
}

const readFile = async () => {
    try {
        const data = await JSON.parse(fsProm.readFile('./list.json', 'utf8'));
        console.log('List is read.')
        return data;
    } catch (error) {
        console.error(err);
        return err;
    }
}

const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
}

const jsonMiddleware = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
}

const getList = (req, res) => {
    res.write(JSON.stringify(readFile()));
    res.end();
}

const notFound = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({ message: 'Route not found' }));
    res.end();
}

const server = http.createServer((req, res) => {
    logger(req, res, () => {
        if (req.url === '/api/list' && req.method === 'GET') {
            getList();
        } else {
            notFound();
        }
    })
});

server.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
})
