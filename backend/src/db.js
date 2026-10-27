const { Pool } = require('pg');
const { getConfig } = require('./config');

const config = getConfig();
const pool = new Pool({ connectionString: config.databaseUrl });

module.exports = { pool };
