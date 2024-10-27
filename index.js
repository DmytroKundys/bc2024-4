const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const path = require('path');
const superagent = require('superagent');
const program = new Command();

program
    .requiredOption('-h, --host <host>', '������ �������')
    .requiredOption('-p, --port <port>', '���� �������')
    .requiredOption('-c, --cache <path>', '���� �� �������� ����');

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
            console.log(`�������� ��� ���� ${code} ����������� � ����.`);
        } catch {
            try {

                console.log(`������������ �������� ��� ���� ${code} � http.cat...`);
                const response = await superagent.get(`https://http.cat/${code}`).buffer(true);

                if (response.status === 200) {
                    await fs.writeFile(filePath, response.body); 
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(response.body);
                    console.log(`�������� ��� ���� ${code} ������ ����������� �� ��������� � ���.`);
                } else {
                    console.error(`�������� ��� ���� ${code} �� �������� �� http.cat.`);
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            } catch (error) {
                console.error(`������� ������������ �������� � http.cat ��� ���� ${code}:`, error.message);
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
            console.log(`�������� ��� ���� ${code} ������ ��������� ����� PUT.`);
        });
    } else if (req.method === 'DELETE') {
        try {
            await fs.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Deleted');
            console.log(`�������� ��� ���� ${code} ������ �������� � ����.`);
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            console.log(`�������� ��� ���� ${code} �� �������� ��� ���������.`);
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        console.log(`����� ${req.method} �� �����������.`);
    }
});

server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
});
