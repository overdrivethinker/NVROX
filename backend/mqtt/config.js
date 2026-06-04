require("dotenv").config({ path: __dirname + "/../.env" });

module.exports = {
    brokerUrl: process.env.MQTT_BROKER,
    options: {
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
    },
    topic: process.env.MQTT_TOPIC,
    qos: Number(process.env.MQTT_QOS),
};
