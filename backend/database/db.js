const knex = require("knex");
const config = require("./knex-config");

const db = knex(config.development);

module.exports = db;
