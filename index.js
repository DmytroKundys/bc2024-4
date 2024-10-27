const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const path = require('path');
const superagent = require('superagent');
const program = new Command();

program
    .requiredOption('-h, --host <host>', 'Адреса сервера')
    .requiredOption('-p, --port <port>', 'Порт сервера')
    .requiredOption('-c, --cache <path>', 'Шлях до директорії кешу');

program.parse(process.argv);

const { host, port, cache } = program.opts();

const fsSync = require('fs');
if (!fsSync.existsSync(cache)) {
    fsSync.mkdirSync(cache, { recursive: true });
}

const server = http.createServer();

server.on('request', async (req, res) => {
    const code = req.url.slice(1); 
    const filePath = path.join(cache, `${code}.jpg`);

    if (req.method === 'GET') {
        try {

            const file = await fs.readFile(filePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(file);
            console.log(`Картинка для коду ${code} завантажена з кешу.`);
        } catch {
            try {

                console.log(`Завантаження картинки для коду ${code} з http.cat...`);
                const response = await superagent.get(`https://http.cat/${code}`).buffer(true);

                if (response.status === 200) {
                    await fs.writeFile(filePath, response.body); 
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(response.body);
                    console.log(`Картинка для коду ${code} успішно завантажена та збережена в кеш.`);
                } else {
                    console.error(`Картинка для коду ${code} не знайдена на http.cat.`);
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            } catch (error) {
                console.error(`Помилка завантаження картинки з http.cat для коду ${code}:`, error.message);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        }
    } else if (req.method === 'PUT') {
        const data = [];
        req.on('data', chunk => data.push(chunk));
        req.on('end', async () => {
            await fs.writeFile(filePath, Buffer.concat(data));
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end('Created');
            console.log(`Картинка для коду ${code} успішно збережена через PUT.`);
        });
    } else if (req.method === 'DELETE') {
        try {
            await fs.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Deleted');
            console.log(`Картинка для коду ${code} успішно видалена з кешу.`);
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            console.log(`Картинка для коду ${code} не знайдена для видалення.`);
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        console.log(`Метод ${req.method} не підтримується.`);
    }
});

server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
});
