const http = require('http');
const fs = require('fs');
const fsProm = require('fs').promises;
const PORT = process.env.PORT;

const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
}

const jsonMiddleware = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
}

const writeFile = async (newData) => {
    try {
        await fsProm.writeFile('./list.json', newData);
        console.log('Back: list is updated.')
    } catch (error) {
        console.error(error);
    }
}

const readFile = async () => {
    try {
        const data = await (fsProm.readFile('./list.json', 'utf8'));
        console.log('Back: list is read.')
        return JSON.parse(data);
    } catch (error) {
        console.error(error);
        return [];
    }
}

const getList = async (req, res) => {
    try {
        const data = await readFile();
        res.write(JSON.stringify(data));
    } catch (error) {
        res.writeHead(500);
        res.write(JSON.stringify({ error: 'Back: could not read list.' }));
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

            const newData = data.filter(x => x.item !== delItem.item);
            newData.forEach((item, index) => { item.id = index + 1; });

            await writeFile(JSON.stringify(newData));

            res.statusCode = 201;
            res.write(JSON.stringify({ message: 'Backend responce: successfull removing' }))
            res.end();
        })
    } catch (error) {
        res.writeHead(500);
        res.write(JSON.stringify({ error: 'Backend responce: couldnt remove item' }))
    }
    res.end();
}

const addItem = async (req, res) => {
    try {
        let body = '';
        req.on('data', (chunk) => {
            body = chunk.toString();
        })
        req.on('end', async () => {
            const data = await readFile();
            data.push({ id: data.length + 1, item: JSON.parse(body).item });
            await writeFile(JSON.stringify(data));

            res.statusCode = 201;
            res.write(JSON.stringify({ message: 'Backend responce: successfull addition' }))
            res.end();
        })
    } catch (error) {
        console.error('Backend error while adding an item ', error)
    }
}

const updateItem = async (req, res) => {
    try {
        let body = '';
        req.on('data', (chunk) => {
            body = chunk.toString();
        })
        req.on('end', async () => {
            const data = await readFile();
            const { oldItem, item: newItem } = JSON.parse(body);
            const newData = data.map(item => item.item === oldItem ? { ...item, item: newItem } : item);
            await writeFile(JSON.stringify(newData));

            res.statusCode = 201;
            res.write(JSON.stringify({ message: 'Backend responce: successfull edit' }))
            res.end();
        })

    } catch (error) {
        console.error("Back:  error while updating ", error);
    }
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
        } else if (req.url === '/api/list' && req.method === 'DELETE') {
            await removeItem(req, res);
        } else if (req.url === '/api/list' && req.method === 'POST') {
            await addItem(req, res);
        } else if (req.url === '/api/list' && req.method === 'PUT') {
            await updateItem(req, res);
        } else {
            notFound(req, res);
        }
    })
});

server.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
})
