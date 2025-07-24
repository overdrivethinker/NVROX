/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
function getRandomStatus() {
    const num = Math.floor(Math.random() * 100);
    return num % 2 === 0 ? "Inactive" : "Active";
}

exports.seed = async function (knex) {
    await knex("devices").del();

    const now = new Date();

    const devices = Array.from({ length: 30 }, (_, i) => {
        const num = i + 1;
        return {
            device_name: `NVROX-${String(num).padStart(2, "0")}`,
            mac_address: `AA:BB:CC:DD:EE:${num
                .toString(16)
                .padStart(2, "0")
                .toUpperCase()}`,
            location: `Building ${num}`,
            status: getRandomStatus(),
            created_at: now,
            updated_at: now,
        };
    });

    await knex("devices").insert(devices);
};
