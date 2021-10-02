const { networkInterfaces } = require('os');

/**
 * Returns a list of IPs from all available interfaces with their
 * corresponding netmasks.
 *
 * @return {Promise<string[]>} List of IPs with their masks from all available
 * interfaces.
 */
exports.getAll = () => {
    const interfaces = networkInterfaces();
    const ips = [];

    for (const iface in interfaces) {
        if (Object.prototype.hasOwnProperty.call(interfaces, iface)) {
            for (const i in interfaces[iface]) {
                const f = interfaces[iface][i];

                if (!f.internal && f.family == 'IPv4') {
                    ips.push(f.cidr);
                }
            }
        }
    }

    return ips;
};
