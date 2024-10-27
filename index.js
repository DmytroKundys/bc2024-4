const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const program = new Command();

program
    .requiredOption('-h, --host <host>', '������ �������')
    .requiredOption('-p, --port <port>', '���� �������')
    .requiredOption('-c, --cache <path>', '���� �� �������� ����');

program.parse(process.argv);

const { host, port, cache } = program.opts();

const server = http.createServer(async (req, res) => {
    res.end('�����-������ ��������');
});

server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);

});
