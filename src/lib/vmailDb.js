// src/lib/vmailDb.js
import mysql from "mysql2/promise";

let pool = null;

export function getVmailPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.VMAIL_DB_HOST || "127.0.0.1",
      port: parseInt(process.env.VMAIL_DB_PORT || "3306"),
      user: process.env.VMAIL_DB_USER,
      password: process.env.VMAIL_DB_PASS,
      database: process.env.VMAIL_DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}