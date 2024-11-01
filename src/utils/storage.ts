import axios from 'axios';
import winston from 'winston';
import { Pool } from 'pg';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

export const pool = new Pool({
    connectionString: "postgresql://PR_Tracker_owner:JGAnwKy8kZY2@ep-cold-cell-a51c5kj8.us-east-2.aws.neon.tech:3007/PR_Tracker?sslmode=require",
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000
});

// Log pool events
pool.on('connect', () => {
    logger.info('New database connection established', {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount
    });
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', {
        error: err,
        message: err.message,
        stack: err.stack
    });
});

pool.on('remove', () => {
    logger.info('Database connection removed from pool', {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount
    });
});

export const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, i), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};

function extractPRNumber(prUrl: string): string {
    const matches = prUrl.match(/\/pull\/(\d+)/);
    if (!matches) {
        logger.warn('Failed to extract PR number from URL', { prUrl });
        return prUrl;
    }
    return matches[1];
}

export async function getPRProgress(pr: string) {
    const prNumber = extractPRNumber(pr);
    try {
        const response = await axios.get('https://hackpadtracker.vercel.app/api/progress', {
            params: { pr: prNumber }
        });
        logger.info('Successfully fetched PR progress', { prNumber });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                logger.error('Error fetching progress', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    prNumber
                });
            } else {
                logger.error('Network error fetching progress', {
                    message: error.message,
                    prNumber
                });
            }
        } else {
            logger.error('Unexpected error fetching progress', {
                error,
                prNumber
            });
        }
        return null;
    }
}

export async function savePRProgress(pr: string, progress: number, state: string) {
    const prNumber = extractPRNumber(pr);
    try {
        const response = await axios.post('https://hackpadtracker.vercel.app/api/progress', {
            pr: prNumber,
            progress,
            state
        });
        logger.info('Successfully updated PR progress', { prNumber, progress, state });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                logger.error('Error updating progress', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    prNumber
                });
            } else {
                logger.error('Network error updating progress', {
                    message: error.message,
                    prNumber
                });
            }
        } else {
            logger.error('Unexpected error updating progress', {
                error,
                prNumber
            });
        }
        throw error;
    }
}