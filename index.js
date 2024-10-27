const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const program = new Command();

program
    .requiredOption('-h, --host <host>', 'Адреса сервера')
    .requiredOption('-p, --port <port>', 'Порт сервера')
    .requiredOption('-c, --cache <path>', 'Шлях до директорії кешу');

program.parse(process.argv);

const { host, port, cache } = program.opts();

const server = http.createServer(async (req, res) => {
    res.end('Проксі-сервер запущено');
});

server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);

});
