const path = require('path');

const { getIPRange } = require('get-ip-range');
const Evilscan = require('evilscan');

const ifTools = require('./lib/ifTools');
const ipcalc = require('./lib/ipcalc');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
});

(async () => {
    const ips = await ifTools.getAll();

    for (const { ip, mask } of ips) {
        const { netMin, netMax, ipClass } = ipcalc.parse(`${ip}/${mask}`);

        if (ipClass != 'Class A') {
            const ipRange = getIPRange(netMin, netMax);

            for (const ip of ipRange) {
                try {
                    const scan = new Evilscan({
                        target: ip,
                        port: process.env.REQUIRED_PORTS,
                        concurrency: process.env.CONCURRENCY
                    });

                    scan.on('result', data => {
                        console.log(data);
                    });

                    scan.on('error', err => {
                        throw err;
                    });

                    scan.run();
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }
})();
