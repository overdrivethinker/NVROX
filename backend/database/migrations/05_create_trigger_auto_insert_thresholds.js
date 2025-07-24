exports.up = async function (knex) {
    const dbClient = knex.client.config.client;

    if (dbClient === "pg") {
        await knex.raw(`
      CREATE OR REPLACE FUNCTION insert_default_thresholds()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO sensor_thresholds (mac_address, parameter, lower_limit, upper_limit, created_at, updated_at)
        VALUES 
          (NEW.mac_address, 'Temperature', 22.00, 30.00, NOW(), NOW()),
          (NEW.mac_address, 'Humidity', 40.00, 50.00, NOW(), NOW());
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        await knex.raw(`
      CREATE TRIGGER auto_insert_thresholds
      AFTER INSERT ON devices
      FOR EACH ROW
      EXECUTE FUNCTION insert_default_thresholds();
    `);
    } else if (
        dbClient === "mysql" ||
        dbClient === "mysql2" ||
        dbClient === "mariadb"
    ) {
        await knex.raw(`
      DELIMITER $$

      CREATE TRIGGER auto_insert_thresholds
      AFTER INSERT ON devices
      FOR EACH ROW
      BEGIN
        INSERT INTO sensor_thresholds (mac_address, parameter, lower_limit, upper_limit, created_at, updated_at)
        VALUES (NEW.mac_address, 'Temperature', 22.00, 30.00, NOW(), NOW());

        INSERT INTO sensor_thresholds (mac_address, parameter, lower_limit, upper_limit, created_at, updated_at)
        VALUES (NEW.mac_address, 'Humidity', 40.00, 50.00, NOW(), NOW());
      END$$

      DELIMITER ;
    `);
    } else if (dbClient === "mssql") {
        await knex.raw(`
      CREATE TRIGGER auto_insert_thresholds
      ON devices
      AFTER INSERT
      AS
      BEGIN
        SET NOCOUNT ON;

        INSERT INTO sensor_thresholds (mac_address, parameter, lower_limit, upper_limit, created_at, updated_at)
        SELECT i.mac_address, 'Temperature', 22.00, 30.00, GETDATE(), GETDATE()
        FROM inserted i;

        INSERT INTO sensor_thresholds (mac_address, parameter, lower_limit, upper_limit, created_at, updated_at)
        SELECT i.mac_address, 'Humidity', 40.00, 50.00, GETDATE(), GETDATE()
        FROM inserted i;
      END;
    `);
    } else {
        console.warn("Trigger not created: Unsupported DB client →", dbClient);
    }
};

exports.down = async function (knex) {
    const dbClient = knex.client.config.client;

    if (dbClient === "pg") {
        await knex.raw(
            `DROP TRIGGER IF EXISTS auto_insert_thresholds ON devices;`
        );
        await knex.raw(`DROP FUNCTION IF EXISTS insert_default_thresholds();`);
    } else if (
        dbClient === "mysql" ||
        dbClient === "mysql2" ||
        dbClient === "mariadb"
    ) {
        await knex.raw(
            `DROP TRIGGER IF EXISTS auto_insert_thresholds ON devices;`
        );
    } else if (dbClient === "mssql") {
        await knex.raw(`DROP TRIGGER auto_insert_thresholds ON devices;`);
    }
};
