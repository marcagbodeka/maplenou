const mysql = require('mysql2/promise');
const { db } = require('./env');

let pool;

function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: db.host,
      user: db.user,
      password: db.password,
      database: db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

module.exports = { getDbPool };




