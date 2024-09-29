const http = require('http');
const fs = require('fs');
const fsProm = require('fs').promises;
const PORT = process.env.PORT;

const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Разрешает запросы с любого источника
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Разрешает указанные методы
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Разрешает заголовки Content-Type
}

const writeFile = async (newData) => {
    try {
        await fsProm.writeFile('./list.json', newData);
        console.log('List is updated.')
    } catch (error) {
        console.error(error);
    }
}

const readFile = async () => {
    try {
        const data = await (fsProm.readFile('./list.json', 'utf8'));
        console.log('List is read.')
        return JSON.parse(data);
    } catch (error) {
        console.error(error);
        return [];
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

const getList = async (req, res) => {
    try {
        const data = await readFile();
        res.write(JSON.stringify(data));
    } catch (error) {
        res.writeHead(500);
        res.write(JSON.stringify({ error: 'Could not read list.' }));
    }
    res.end();
};

const removeItem = async (req, res) => {
    try {
        let body = ''
        req.on('data', (chunk) => {
            body = chunk.toString();
        })
        req.on('end', async () => {
            const delItem = JSON.parse(body);
            const data = await readFile();
            console.log((data))
            console.log(delItem.item)
            const newData = data.filter(x => x.item !== delItem.item);
            newData.forEach((item, index) => {
                item.id = index + 1;
            });
            await writeFile(JSON.stringify(newData));
            res.statusCode = 201;
            res.write(JSON.stringify({ message: 'Success' }))
            res.end();
        })
    } catch (error) {
        res.writeHead(500);
        res.write(JSON.stringify({ error: 'Couldnt remove item' }))
    }
    res.end();
}

const notFound = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({ message: 'Route not found' }));
    res.end();
}

const server = http.createServer((req, res) => {
    setCorsHeaders(res);
    logger(req, res, async () => {
        if (req.url === '/api/list' && req.method === 'GET') {
            await getList(req, res);
        } else if ((req.url === '/api/list' && req.method === 'POST')) {
            await removeItem(req, res);
        } else {
            notFound(req, res);
        }
    })
});

server.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
})
