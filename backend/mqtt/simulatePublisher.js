require("module-alias/register");

const mqtt = require("mqtt");
const { brokerUrl, options, topic, qos } = require("@mqtt/mqttConfig");

const TOTAL_DEVICES = 30;
const clients = [];

function generateMacAddress(index) {
    const hex = (index + 1).toString(16).padStart(2, "0");
    return `AA:BB:CC:DD:EE:${hex.toUpperCase()}`;
}

for (let i = 0; i < TOTAL_DEVICES; i++) {
    const macAddress = generateMacAddress(i);
    const clientId = `[SIMULATE] Device ${i + 1}`;

    const client = mqtt.connect(brokerUrl, {
        ...options,
        clientId,
    });

    client.on("connect", () => {
        console.log(`${clientId} connected`);

        let t = 0;
        setInterval(() => {
            t += 1;

            // Buat data acak + fluktuasi gelombang
            const baseTemp = 25 + (i % 5); // dasar suhu tiap device bisa beda
            const tempNoise = Math.sin(t / 10 + i) * 2 + Math.random() * 1;
            const temp = (baseTemp + tempNoise).toFixed(2);

            const baseHumid = 50 + (i % 10);
            const humidNoise = Math.cos(t / 15 + i) * 3 + Math.random() * 2;
            const humid = (baseHumid + humidNoise).toFixed(2);

            const payload = JSON.stringify({
                mac_address: macAddress,
                temp,
                humid,
                timestamp: new Date().toISOString(),
            });

            client.publish(topic, payload, { qos });
        }, 1000);
    });

    client.on("error", (err) => {
        console.error(`${clientId} Error:`, err.message);
    });

    clients.push(client);
}
