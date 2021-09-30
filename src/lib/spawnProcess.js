const { spawn } = require('child_process');

/**
 * @param {string} bin Binary to run.
 * @param {Array<string>} params Array of parameters to pass down.
 * @return {Promise<Buffer[] | NodeJS.ErrnoException>} Returns stdout or stderr error code of bin.
 */
const spawnProcess = (bin, params) => {
    const child = spawn(bin, params);
    const stdout = [];
    const stderr = [];

    if (child.stdout)
        child.stdout.on('data', data => stdout.push(data));

    if (child.stderr)
        child.stderr.on('data', data => stderr.push(data));

    return new Promise((resolve, reject) => {
        child.on('error', reject);

        child.on('close', code => {
            if (code === 0) {
                resolve(stdout);
            } else {
                const err = new Error(`child exited with code ${code}`);

                err.message = stderr.join(' ');
                err.code = code.toString();

                reject(err);
            }
        });
    });
};

module.exports = spawnProcess;
