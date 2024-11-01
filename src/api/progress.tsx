import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, PoolClient } from 'pg';
import winston from 'winston';
import { z } from 'zod';

const requiredEnvVars = ['DATABASE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
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

const PostRequestSchema = z.object({
    pr: z.string().min(1),
    progress: z.number().min(0).max(100),
    state: z.string().min(1)
});

const pool = new Pool({
    connectionString: "ep-ancient-hall-a50cnz7s.us-east-2.aws.neon.tech",
    ssl: {
        rejectUnauthorized: true
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

const debounceTimeouts = new Map<string, NodeJS.Timeout>();

interface DatabaseOperation<T> {
    (client: PoolClient): Promise<T>;
}

async function withTransaction<T>(operation: DatabaseOperation<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await operation(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

const rateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100;

function checkRateLimit(ip: string): boolean {
    const requestCount = rateLimit.get(ip) || 0;

    if (requestCount >= MAX_REQUESTS) {
        return false;
    }

    rateLimit.set(ip, requestCount + 1);
    setTimeout(() => rateLimit.delete(ip), RATE_LIMIT_WINDOW);
    return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const ip = req.headers['x-forwarded-for'] as string || 'unknown';

    if (!checkRateLimit(ip)) {
        logger.warn(`Rate limit exceeded for IP: ${ip}`);
        res.status(429).json({ error: 'Too Many Requests' });
        return;
    }

    try {
        switch (req.method) {
            case 'GET':
                await handleGet(req, res);
                break;
            case 'POST':
                await handlePost(req, res);
                break;
            default:
                logger.warn(`Method not allowed: ${req.method}`);
                res.status(405).json({ error: 'Method Not Allowed' });
        }
    } catch (error) {
        logger.error('Error handling request:', {
            error,
            path: req.url,
            method: req.method,
            ip
        });

        const isOperationalError = error instanceof z.ZodError;
        res.status(isOperationalError ? 400 : 500).json({
            error: isOperationalError ? 'Validation Error' : 'Internal Server Error',
            message: isOperationalError ? error.errors : 'An unexpected error occurred'
        });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
    const pr = req.query.pr as string;
    if (!pr) {
        res.status(400).json({ error: 'PR query parameter is required' });
        return;
    }

    logger.info('Fetching progress', { pr });

    const result = await withTransaction(async (client) => {
        const { rows } = await client.query(
            'SELECT pr, progress, state FROM pr_tracker WHERE pr = $1',
            [pr]
        );
        return rows[0];
    });

    if (!result) {
        res.status(404).json({ error: 'PR not found' });
        return;
    }

    res.status(200).json(result);
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
    const validationResult = PostRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
        res.status(400).json({ error: 'Validation Error', details: validationResult.error });
        return;
    }

    const { pr, progress, state } = validationResult.data;

    try {
        await withTransaction(async (client) => {
            await client.query(
                `INSERT INTO pr_tracker (pr, progress, state)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (pr)
                     DO UPDATE SET
                         progress = EXCLUDED.progress,
                         state = EXCLUDED.state`,
                [pr, progress, state]
            );
        });

        logger.info('Progress updated', { pr, progress, state });
        res.status(200).json({ message: 'Progress updated successfully' });
    } catch (error) {
        logger.error('Error updating progress', { error, pr });
        res.status(500).json({ error: 'Failed to update progress' });
    }
}

async function cleanup() {
    logger.info('Cleaning up...');
    for (const timeout of debounceTimeouts.values()) {
        clearTimeout(timeout);
    }
    await pool.end();
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);