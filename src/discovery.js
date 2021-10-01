const Evilscan = require('evilscan');

const ifTools = require('./lib/ifTools');
const ipcalc = require('./lib/ipcalc');

/**
 * Returns Evilscan EventEmitter hooks.
 *
 * @param {string} target Host to scan.
 * @param {number} maxRange Maximum range of possible hosts to scan.
 * @param {string} ports Ports to scan. Can either be a range or
 * individual ports separated by a comma. E.g: (80,20-22,443).
 * @param {number} concurrency Amount of concurrent jobs to run. The higher
 * the faster the script will loop through all possible hosts.
 * @return {Promise<Array>} EventEmitter
 */
const scanHost = (target, { ports, concurrency }) =>
    new Promise((resolve, reject) => {
        console.log(`Scanning network ${target} for ports ${ports}...`);
        console.log(`Concurrency: ${concurrency}`);

        const solved = [];

        const scan = new Evilscan({
            target: target,
            port: ports,
            concurrency
        });

        scan.on('result', data => {
            solved.push(data);
        });

        scan.on('done', () => {
            resolve(solved);
        });

        scan.on('error', err => {
            reject(err);
        });

        scan.run();
    });


exports.run = async ({ maxRange = 70000, ports, concurrency = 10000 }) => {
    process.env.MAX_RANGE = maxRange;

    const ips = await ifTools.getAll();
    const solved = [];

    for (const { ip, mask } of ips) {
        const { networkAddr, hosts } = ipcalc.parse(`${ip}/${mask}`);

        if (hosts <= maxRange) {
            const found = await scanHost(`${networkAddr}/${mask}`, {
                ports,
                concurrency
            });

            solved.push(...found);
        }
    }

    return solved;
};
