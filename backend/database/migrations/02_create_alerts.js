exports.up = function (knex) {
    return knex.schema.createTable("alerts", function (table) {
        table.increments("id").primary();
        table
            .string("mac_address")
            .references("mac_address")
            .inTable("devices")
            .onDelete("CASCADE");
        table.enu("parameter", ["Temperature", "Humidity"]);

        table.decimal("value", 5, 2);
        table.decimal("threshold", 5, 2);

        table.enu("level", ["Warning", "Alert"]);
        table.enu("status", ["Under Limit", "Over Limit"]);

        table.enu("threshold_type", [
            "alert_low",
            "warning_low",
            "warning_high",
            "alert_high",
        ]);

        table.timestamp("recorded_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("alerts");
};
