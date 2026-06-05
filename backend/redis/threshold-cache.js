const redis = require("./config");
const knex = require("../database/db");

const getThresholds = async (macAddress) => {
    const key = `thresholds:${macAddress}`;
    let cached = await redis.get(key);

    if (cached) {
        return JSON.parse(cached);
    }

    const thresholds = await knex("sensor_thresholds").where({
        mac_address: macAddress,
    });

    if (thresholds.length > 0) {
        await redis.set(key, JSON.stringify(thresholds));
    }

    return thresholds;
};

const clearThresholdCache = async () => {
    const thresholdKeys = await redis.keys("thresholds:*");

    if (thresholdKeys.length > 0) await redis.del(...thresholdKeys);
};

module.exports = {
    getThresholds,
    clearThresholdCache,
};
