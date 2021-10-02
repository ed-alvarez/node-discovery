const path = require('path');
const mqtt = require('async-mqtt');

require('dotenv').config({
    path: path.join(__dirname, '../.env')
});

const client = mqtt.connect(`tcp://${process.env.MOSQUITTO_HOST}:${process.env.MOSQUITTO_PORT}`);

const onConnect = async () => {
    console.log('Trying to connect to Mosquitto broker...');

    try {
        await client.publish('berwick-upon-tweed', 'test');
        await client.end();

        console.log('Test success');
    } catch (err) {
        console.log(err.message);
        process.exit(-1);
    }
};

client.on('connect', onConnect);
