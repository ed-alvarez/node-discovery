const Evilscan = require('evilscan');

const ifTools = require('./lib/ifTools');
const ipcalc = require('./lib/ipcalc');

/**
 * @typedef {Object} IServices
 * @property {string} ip IP of interface
 * @property {number} port Service port
 * @property {string} status Service status
 */

/**
 * Returns Evilscan Array of services found.
 *
 * @param {string} target Host to scan.
 * @param {number} maxRange Maximum range of possible hosts to scan.
 * @param {string} ports Ports to scan. Can either be a range or
 * individual ports separated by a comma. E.g: (80,20-22,443).
 * @param {number} concurrency Amount of concurrent jobs to run. The higher
 * the faster the script will loop through all possible hosts.
 * @return {Promise<IServices>} EventEmitter
 */
const scanHost = (target, { ports, concurrency }) =>
    new Promise((resolve, reject) => {
        const log = process.env.NODE_ENV == 'dev' ? console.log.bind(console) : () => { };

        log(`Scanning network ${target} for ports ${ports}...`);
        log(`Concurrency: ${concurrency}`);

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

/**
 * Runs the necessary tools to scan all
 * available interfaces.
 *
 * @param {Object} param Configuration parameters for the scan job.
 * @param {number} [param.maxRange = 70000] Maximum possible hosts to scan
 * @param {string} param.ports Ports to scan. Can either be a range or
 * individual ports separated by a comma. E.g: (80,20-22,443).
 * @param {number} [param.concurrency = 10000] Amount of concurrent jobs to run. The higher
 * the faster the script will loop through all possible hosts.
 * @param {boolean} [param.debug = false] Debug our scan job.
 * @return {Promise<IServices[]>} EventEmitter
 */
exports.run = async ({ maxRange = 70000, ports, concurrency = 10000, debug = false }) => {
    process.env.MAX_RANGE = maxRange;
    process.env.NODE_ENV = debug ? 'dev' : 'prod';

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
