exports.up = function (knex) {
    return knex.schema.createTable("users", function (table) {
        table.string("user_id", 36).primary();
        table.string("username", 100).notNullable().unique();
        table.string("email", 255).notNullable().unique();
        table.string("password", 255).notNullable();
        table.enu("role", ["Admin", "User"]).notNullable().defaultTo("User");
        table
            .enu("status", ["Active", "Inactive"])
            .notNullable()
            .defaultTo("Active");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("last_login").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("users");
};
