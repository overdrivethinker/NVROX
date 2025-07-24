const redis = require("./index");
const knex = require("@db/knex");

const getDeviceId = async (mac_address) => {
    const key = `device:${mac_address}`;
    const cached = await redis.get(key);

    if (cached) {
        return JSON.parse(cached);
    }

    const device = await knex("devices")
        .select("mac_address", "device_name", "location", "status")
        .where({ mac_address, status: "Active" })
        .first();

    if (!device) return null;

    await redis.set(key, JSON.stringify(device));

    return device;
};

const clearDeviceCache = async () => {
    const deviceKeys = await redis.keys("device:*");

    if (deviceKeys.length > 0) await redis.del(...deviceKeys);
};

module.exports = {
    getDeviceId,
    clearDeviceCache,
};
