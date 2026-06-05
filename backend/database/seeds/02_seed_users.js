const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

exports.seed = async function (knex) {
    await knex("users").del();

    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    await knex("users").insert([
        {
            user_id: uuidv4(),
            username: "MulioNode",
            email: "mulionode@example.com",
            password: adminPassword,
            role: "Admin",
            status: "Active",
            created_at: knex.fn.now(),
            last_login: knex.fn.now(),
        },
        {
            user_id: uuidv4(),
            username: "BashLib",
            email: "bashlib@example.com",
            password: userPassword,
            role: "User",
            status: "Inactive",
            created_at: knex.fn.now(),
            last_login: knex.fn.now(),
        },
        {
            user_id: uuidv4(),
            username: "LowHood",
            email: "lowhood@example.com",
            password: adminPassword,
            role: "Admin",
            status: "Active",
            created_at: knex.fn.now(),
            last_login: knex.fn.now(),
        },
        {
            user_id: uuidv4(),
            username: "SoulHash",
            email: "soulhash@example.com",
            password: userPassword,
            role: "User",
            status: "Inactive",
            created_at: knex.fn.now(),
            last_login: knex.fn.now(),
        },
        {
            user_id: uuidv4(),
            username: "PraboGo",
            email: "prabogo@example.com",
            password: adminPassword,
            role: "Admin",
            status: "Active",
            created_at: knex.fn.now(),
            last_login: knex.fn.now(),
        },
    ]);
};
