const spawnProcess = require('./spawnProcess');

/**
 * @typedef {Object} Interfaces
 * @property {string} ip IP of interfaces
 * @property {string} mask Mask of IP
 */

/**
 * Returns a list of IPs from all available interfaces with their
 * corresponding netmasks.
 *
 * @return {Promise<Interfaces[]>} List of IPs with their masks from all available
 * interfaces.
 */
exports.getAll = async () => {
    try {
        const [stdout] = await spawnProcess('ip', ['-4', 'addr']);
        const inetEx = new RegExp(/inet\s((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/[0-9]*/g);

        const ifs = stdout.toString().match(inetEx);

        if (!ifs)
            throw new Error('No valid interfaces found.');

        const inets = ifs.map(d => {
            const [ip, mask] = d.slice(5).split('/');

            return {
                ip,
                mask
            };
        }).filter(f => f);

        return inets;
    } catch (err) {
        console.error(err);
    }
};
