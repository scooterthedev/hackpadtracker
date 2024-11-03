import { Pool, PoolConfig } from 'pg';
import winston from 'winston';

// Create logger configuration
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
            return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const dbConfig: PoolConfig = {
    connectionString: "postgresql://PR_Tracker_owner:JGAnwKy8kZY2@ep-cold-cell-a51c5kj8.us-east-2.aws.neon.tech:3007/PR_Tracker?sslmode=require",
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000,
    ssl: {
        rejectUnauthorized: true
    }
};

export const pool = new Pool(dbConfig); 