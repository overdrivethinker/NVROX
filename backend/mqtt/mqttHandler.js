require("module-alias/register");

const mqtt = require("mqtt");
const knex = require("@db/knex");
const { brokerUrl, options, topic, qos } = require("@mqtt/mqttConfig");
const { getDeviceId, clearDeviceCache } = require("@redis/deviceCache");
const { getThresholds, clearThresholdCache } = require("@redis/thresholdCache");
const { emitToClients } = require("@socket/socketHandler");

const clearAllCache = async () => {
    console.log("[INIT] Clearing Redis cache");
    await clearDeviceCache();
    await clearThresholdCache();
};

(async () => {
    await clearAllCache();

    const client = mqtt.connect(brokerUrl, {
        ...options,
        clientId: `backend_logger_${Date.now()}_${Math.floor(
            Math.random() * 1000
        )}`,
    });

    client.on("connect", () => {
        console.log("[CONNECTED] Subscribe to broker");

        client.subscribe(topic, { qos }, (err) => {
            if (err) {
                console.error("[ERROR] Subscribe", err.message);
            } else {
                console.log(`[SUCCESS] Subscribed to topic ${topic}`);
            }
        });
    });

    client.on("message", async (receivedTopic, message) => {
        if (receivedTopic !== topic) return;

        try {
            const data = JSON.parse(message.toString());
            const { mac_address, temp, humid } = data;

            const device = await getDeviceId(mac_address);
            if (!device) {
                console.warn(
                    `[IGNORED] ${mac_address} not registered or inactive`
                );
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

            console.log(`[SAVED] ${mac_address} | ${temp}°C | ${humid}%`);

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
                        status: value < t.lower_limit ? "Deceed" : "Exceed",
                        recorded_at: knex.fn.now(),
                    });
                }
            }

            if (alerts.length > 0) {
                await knex("alerts").insert(alerts);
                console.warn(
                    `[ALERT] Triggered for ${mac_address}: ${alerts.length} alert(s)`
                );
            }
        } catch (err) {
            console.error("[ERROR] handling message:", err.message);
        }
    });
})();
