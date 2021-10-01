const discovery = require('../src/discovery');

(async () => {
    const sdp = await discovery.run({
        ports: '1194,1883',
        concurrency: 15000
    });
    
    console.log(sdp);
})();
