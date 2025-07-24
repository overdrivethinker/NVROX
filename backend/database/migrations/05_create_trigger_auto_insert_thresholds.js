exports.up = async function (knex) {
  const dbClient = knex.client.config.client;

  if (
    dbClient === "mysql" ||
    dbClient === "mysql2" ||
    dbClient === "mariadb"
  ) {
    try {
      // Drop the trigger if it exists
      await knex.raw(`
              DROP TRIGGER IF EXISTS auto_insert_thresholds;
          `);

      // Create the trigger without DELIMITER
      await knex.raw(`
              CREATE TRIGGER auto_insert_thresholds
              AFTER INSERT ON devices
              FOR EACH ROW
              BEGIN
                  INSERT IGNORE INTO sensor_thresholds
                      (mac_address, parameter, lower_limit, upper_limit, created_at, updated_at)
                  VALUES
                      (NEW.mac_address, 'Temperature', 22.00, 30.00, NOW(), NOW()),
                      (NEW.mac_address, 'Humidity', 40.00, 50.00, NOW(), NOW());
              END;
          `);
    } catch (error) {
      console.error("Error creating MySQL/MariaDB trigger:", error.message);
      throw error;
    }
  } else if (dbClient === "pg") {
    try {
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
    } catch (error) {
      console.error("Error creating PostgreSQL trigger:", error.message);
      throw error;
    }
  } else if (dbClient === "mssql") {
    try {
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
    } catch (error) {
      console.error("Error creating MSSQL trigger:", error.message);
      throw error;
    }
  } else {
    console.warn("Trigger not created: Unsupported DB client →", dbClient);
  }
};

exports.down = async function (knex) {
  const dbClient = knex.client.config.client;

  try {
    if (dbClient === "pg") {
      await knex.raw(`DROP TRIGGER IF EXISTS auto_insert_thresholds ON devices;`);
      await knex.raw(`DROP FUNCTION IF EXISTS insert_default_thresholds();`);
    } else if (
      dbClient === "mysql" ||
      dbClient === "mysql2" ||
      dbClient === "mariadb"
    ) {
      await knex.raw(`DROP TRIGGER IF EXISTS auto_insert_thresholds;`);
    } else if (dbClient === "mssql") {
      await knex.raw(`DROP TRIGGER auto_insert_thresholds ON devices;`);
    }
  } catch (error) {
    console.error("Error dropping trigger:", error.message);
    throw error;
  }
};