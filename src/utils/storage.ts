import axios from 'axios';
import winston from 'winston';
import { Pool, PoolClient, QueryResult } from 'pg';

const logger = winston.createLogger({
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

const dbConnectionString = "postgresql://PR_Tracker_owner:JGAnwKy8kZY2@ep-cold-cell-a51c5kj8.us-east-2.aws.neon.tech:3007/PR_Tracker?sslmode=require";
if (!dbConnectionString) {
    throw new Error('DATABASE_URL is not set properly');
}

export const pool = new Pool({
    connectionString: dbConnectionString,
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000,
    ssl: {
        rejectUnauthorized: true
    }
});

pool.on('connect', (client: PoolClient) => {
    logger.info('Database connection established', {
        clientId: client.processID,
        poolStats: getPoolStats()
    });
});

pool.on('error', (err: Error, client: PoolClient) => {
    logger.error('Database pool error', {
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack
        },
        clientId: client?.processID,
        poolStats: getPoolStats()
    });
});

pool.on('remove', (client: PoolClient) => {
    logger.info('Database connection removed', {
        clientId: client.processID,
        poolStats: getPoolStats()
    });
});

function getPoolStats() {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
    };
}

type QueryArgs = string | { text: string; values?: any[] };

const originalQuery = pool.query.bind(pool);
pool.query = async function<T = any>(...args: any[]): Promise<QueryResult<T>> {
    const startTime = process.hrtime();
    
    try {
        const result = await originalQuery(...args);
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        logger.info('Query executed successfully', {
            query: sanitizeQuery(args[0]),
            duration: `${duration.toFixed(2)}ms`,
            rowCount: result.rowCount
        });

        return result;
    } catch (error) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        logger.error('Query execution failed', {
            query: sanitizeQuery(args[0]),
            duration: `${duration.toFixed(2)}ms`,
            error: {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });
        throw error;
    }
};

function sanitizeQuery(query: QueryArgs): string {
    if (typeof query === 'string') {
        return query;
    }
    return query.text;
}

export const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> => {
    let lastError: Error | unknown;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                const delay = Math.min(baseDelay * Math.pow(2, i), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
                logger.warn('Retrying operation', {
                    attempt: i + 1,
                    maxRetries,
                    delay,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
    throw lastError;
};

interface PRProgress {
    progress: number;
    state: string;
}

function extractPRNumber(prUrl: string): string {
    const matches = prUrl.match(/\/pull\/(\d+)/);
    if (!matches) {
        logger.warn('Failed to extract PR number from URL', { prUrl });
        throw new Error(`Invalid PR URL format: ${prUrl}`);
    }
    return matches[1];
}

const API_BASE_URL = process.env.API_BASE_URL || 'https://hackpadtracker.vercel.app/api';

export async function getPRProgress(pr: string): Promise<PRProgress | null> {
    const prNumber = extractPRNumber(pr);
    
    try {
        const response = await axios.get<PRProgress>(`${API_BASE_URL}/progress`, {
            params: { pr: prNumber },
            timeout: 5000
        });
        
        logger.info('Successfully fetched PR progress', { prNumber });
        return response.data;
    } catch (error) {
        handleAxiosError('fetching', prNumber, error);
        return null;
    }
}

export async function savePRProgress(
    pr: string,
    progress: number,
    state: string
): Promise<PRProgress> {
    const prNumber = extractPRNumber(pr);
    
    try {
        const response = await axios.post<PRProgress>(
            `${API_BASE_URL}/progress`,
            {
                pr: prNumber,
                progress,
                state
            },
            { timeout: 5000 }
        );
        
        logger.info('Successfully updated PR progress', { prNumber, progress, state });
        return response.data;
    } catch (error) {
        handleAxiosError('updating', prNumber, error);
        throw error;
    }
}

function handleAxiosError(operation: string, prNumber: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            logger.error(`Error ${operation} progress`, {
                status: error.response.status,
                statusText: error.response.statusText,
                prNumber
            });
        } else {
            logger.error(`Network error ${operation} progress`, {
                message: error.message,
                prNumber
            });
        }
    } else {
        logger.error(`Unexpected error ${operation} progress`, {
            error: error instanceof Error ? error.message : String(error),
            prNumber
        });
    }
}