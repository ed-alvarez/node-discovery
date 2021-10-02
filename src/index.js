const fs = require('fs/promises');
const net = require('net');
const path = require('path');
const dotenv = require('dotenv');

const spawnProcess = require('./lib/spawnProcess');
const discovery = require('./discovery');

const probeHost = (ip, port) => new Promise(resolve => {
    const sock = new net.Socket();

    sock.setTimeout(2500);

    sock.connect(port, ip);

    sock.on('connect', () => {
        resolve(true);
        sock.destroy();
    });

    sock.on('error', () => {
        resolve(false);
    });

    sock.on('timeout', () => {
        resolve(false);
    });
});

const writeConfigFile = async ip => {
    try {
        const envFilePath = path.join(__dirname, '../.env');
        const envFile = await fs.readFile(envFilePath);

        const result = envFile.toString().replace(/OVPN_HOST=((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g,
            `OVPN_HOST=${ip}`);

        await fs.writeFile(envFilePath, result, 'utf-8');

        process.env.OVPN_HOST = ip;

        const ovpnClientFilePath = path.join(process.env.OVPN_CLIENT_FILE);
        const ovpnClientFile = await fs.readFile(ovpnClientFilePath);

        const remoteOVPNRegEx = new RegExp(`remote\\s((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\s${
            process.env.OVPN_PORT}`, 'g');

        const ovpnResult = ovpnClientFile.toString().replace(remoteOVPNRegEx,
            `remote ${ip} ${process.env.OVPN_PORT}`);

        await fs.writeFile(ovpnClientFilePath, ovpnResult, 'utf-8');

        console.log(`Updated configuration file with new found IP ${ip}`);

        console.log('Attempting to restart OpenVPN client...');

        await spawnProcess('systemctl', ['restart', 'openvpn@client']);
    } catch (err) {
        return err;
    }
};

const discoverOVPN = async () => {
    const sdp = await discovery.run({
        ports: process.env.OVPN_PORT,
        concurrency: 10000,
        debug: true
    });

    if (sdp.length == 0) {
        console.log('No services discovered in available networks.');
        return;
    }

    const ip = sdp[0].ip;

    console.log(`Found OpenVPN service at ${ip}. Attempting to update configuration files.`);

    try {
        await writeConfigFile(ip);
    } catch (err) {
        console.error(err);
    }
};

setInterval(() => {
    dotenv.config({
        path: path.join(__dirname, '../.env')
    });

    probeHost(process.env.OVPN_HOST, process.env.OVPN_PORT)
        .then(async isAlive => {
            if (!isAlive) {
                console.log(`OpenVPN not running in address ${process.env.OVPN_HOST}:${process.env.OVPN_PORT}`);
                await discoverOVPN();
                return;
            }

            console.log('Service is alive');
        });
}, 5000);
