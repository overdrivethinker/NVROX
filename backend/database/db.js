const knex = require("knex");
const config = require("./knex_config");

const db = knex(config.development);

module.exports = db;
