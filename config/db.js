const queryBuilder = require('node-querybuilder');

require("dotenv").config();

const {
    DB_HOSTNAME,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT
} = process.env;

// console.log(DB_HOSTNAME)
// console.log(DB_USERNAME)

/** === start queryBuilder === */
const settings = {
    host: DB_HOSTNAME,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    // port: DB_PORT,
    connectionLimit:100,
};

const pool = new queryBuilder(settings, 'mysql', 'pool');

// console.log(pool);
/** === end queryBuilder === */

module.exports = { pool };