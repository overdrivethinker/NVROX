exports.up = function (knex) {
    return knex.schema.createTable("sensor_thresholds", function (table) {
        table.increments("id").primary();
        table
            .string("mac_address")
            .references("mac_address")
            .inTable("devices")
            .onDelete("CASCADE");
        table.enu("parameter", ["Temperature", "Humidity"]);
        table.unique(["mac_address", "parameter"]);
        table.decimal("lower_limit", 5, 2);
        table.decimal("upper_limit", 5, 2);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("sensor_thresholds");
};
