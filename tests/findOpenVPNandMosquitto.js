const discovery = require('../src/discovery');

(async () => {
    const sdp = await discovery.run({
        ports: '1194,1883',
        concurrency: 10000,
        debug: true
    });
    
    if (sdp.length == 0) {
        console.log('No services discovered in available networks.');
        return;
    }

    console.log(sdp);
})();
