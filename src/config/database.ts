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
    connectionString: "postgresql://PR_Tracker_owner:JGAnwKy8kZY2@ep-cold-cell-a51c5kj8.us-east-2.aws.neon.tech/PR_Tracker?sslmode=require",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
        rejectUnauthorized: false
    }
};

export const pool = new Pool(dbConfig);

// Set up pool event listeners
pool.on('connect', () => {
    logger.info('New database connection established');
});

pool.on('error', (err) => {
    logger.error('Unexpected database error', {
        error: err.message,
        stack: err.stack
    });
});

pool.on('remove', () => {
    logger.info('Database connection removed from pool');
}); 