const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const path = require('path');
const program = new Command();

// Налаштування командного рядка
program
    .requiredOption('-h, --host <host>', 'Адреса сервера')
    .requiredOption('-p, --port <port>', 'Порт сервера')
    .requiredOption('-c, --cache <path>', 'Шлях до директорії кешу');

program.parse(process.argv);

const { host, port, cache } = program.opts();

// Створення сервера
const server = http.createServer();

server.on('request', async (req, res) => {
    const code = req.url.slice(1);
    const filePath = path.join(cache, `${code}.jpg`);

    if (req.method === 'GET') {
        try {
            const file = await fs.readFile(filePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(file);
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } else if (req.method === 'PUT') {
        const data = [];
        req.on('data', chunk => data.push(chunk));
        req.on('end', async () => {
            await fs.writeFile(filePath, Buffer.concat(data));
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end('Created');
        });
    } else if (req.method === 'DELETE') {
        try {
            await fs.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Deleted');
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
});

// Запуск сервера
server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
});
