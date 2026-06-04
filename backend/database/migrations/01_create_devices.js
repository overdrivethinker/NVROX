exports.up = function (knex) {
    return knex.schema.createTable("devices", function (table) {
        table.string("device_name").notNullable();
        table.string("mac_address").primary();
        table.string("location");
        table.enu("status", ["Active", "Inactive"]).notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("devices");
};
