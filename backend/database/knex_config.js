require("dotenv").config({ path: __dirname + "/../.env" });

const client = process.env.DB_CLIENT;

const baseConnection = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const mssqlOptions = {
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        instanceName: "",
    },
};

module.exports = {
    development: {
        client,
        connection:
            client === "mssql"
                ? { ...baseConnection, ...mssqlOptions }
                : baseConnection,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: __dirname + "/migrations",
            tableName: "knex_migrations",
        },
        seeds: {
            directory: __dirname + "/seeds",
        },
    },
};
