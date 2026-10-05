import 'dotenv/config'
import pg from 'pg'

export const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'webgis_xlbb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
}

export const newClient = (database = config.database) => new pg.Client({ ...config, database })
