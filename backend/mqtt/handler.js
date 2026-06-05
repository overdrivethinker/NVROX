const mqtt = require("mqtt");
const knex = require("../database/db");
const { brokerUrl, options, topic, qos } = require("./config");
const { getDeviceId, clearDeviceCache } = require("../redis/device-cache");
const {
    getThresholds,
    clearThresholdCache,
} = require("../redis/threshold-cache");
const { emitToClients } = require("../socket/handler");

const clearAllCache = async () => {
    console.log("[REDIS] Clearing cache");
    await clearDeviceCache();
    await clearThresholdCache();
};

(async () => {
    await clearAllCache();

    const client = mqtt.connect(brokerUrl, {
        ...options,
        clientId: `backend_logger_${Date.now()}_${Math.floor(
            Math.random() * 1000,
        )}`,
    });

    client.on("connect", () => {
        console.log("[MQTT] Connected to broker");

        client.subscribe(`${topic}/+`, { qos }, (err) => {
            if (err) {
                console.error("[MQTT] Error subscribing", err.message);
            } else {
                console.log(`[MQTT] Subscribed to topic ${topic}`);
            }
        });
        client.subscribe(`nvrox/heartbeat/+`, { qos }, (err) => {
            if (err)
                console.error(
                    "[MQTT] Error subscribing heartbeat",
                    err.message,
                );
            else console.log("[MQTT] Subscribed to heartbeat topic");
        });
    });

    client.on("message", async (receivedTopic, message) => {
        if (receivedTopic.startsWith("nvrox/heartbeat")) {
            try {
                const { mac_address } = JSON.parse(message.toString());
                const device = await getDeviceId(mac_address);
                if (!device) return;

                emitToClients("heartbeat", { mac_address });
            } catch (err) {
                console.error("[MQTT] Error handling heartbeat:", err.message);
            }
            return;
        }

        if (!receivedTopic.startsWith("nvrox/temp-hum")) {
            return;
        }

        try {
            const deviceName = receivedTopic.split("/").pop();

            const data = JSON.parse(message.toString());
            const { mac_address, temp, humid } = data;

            const device = await getDeviceId(mac_address);

            if (!device) {
                return;
            }
            const now = new Date();

            await knex("sensor_readings").insert({
                mac_address,
                temperature: temp,
                humidity: humid,
                recorded_at: now,
            });

            emitToClients("sensor_data", {
                mac_address,
                temperature: temp,
                humidity: humid,
                recorded_at: now.toISOString(),
                device_name: device.device_name,
                location: device.location,
            });

            const thresholds = await getThresholds(mac_address);
            const alerts = [];

            for (const t of thresholds) {
                const value = t.parameter === "Temperature" ? temp : humid;

                if (value < t.lower_limit || value > t.upper_limit) {
                    alerts.push({
                        mac_address,
                        parameter: t.parameter,
                        value,
                        threshold:
                            value < t.lower_limit
                                ? t.lower_limit
                                : t.upper_limit,
                        status:
                            value < t.lower_limit
                                ? "Under Limit"
                                : "Over Limit",
                        recorded_at: knex.fn.now(),
                    });
                }
            }

            if (alerts.length > 0) {
                await knex("alerts").insert(alerts);
            }
            const tempAlerts = alerts.filter(
                (a) => a.parameter === "Temperature",
            );
            const humidAlerts = alerts.filter(
                (a) => a.parameter === "Humidity",
            );

            emitToClients("new_alerts", {
                mac_address,
                temperature: tempAlerts.length,
                humidity: humidAlerts.length,
            });
        } catch (err) {
            console.error("[MQTT] Error handling message:", err.message);
        }
    });
})();
