import { VercelRequest, VercelResponse } from '@vercel/node';
import * as mysql from 'mysql2/promise';
import winston from 'winston';

// Configure winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

const dbConfig = {
    host: '9burt.h.filess.io',
    user: 'PRTracker_telephone',
    password: '9a25926ccb8d15c44c2dee92f217eb21e3fd9712',
    database: 'PRTracker_telephone',
    port: 3307,
    pool: {
        min: 0,
        max: 4,
        acquire: 30000,
        idle: 10000
    },
    waitForConnections: true
};

const pool = mysql.createPool(dbConfig);

const debounceTimeouts: Map<string, NodeJS.Timeout> = new Map();

async function withConnection<T>(
    operation: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
    const connection = await pool.getConnection();
    try {
        return await operation(connection);
    } finally {
        connection.release();
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method === 'GET') {
            await handleGet(req, res);
        } else if (req.method === 'POST') {
            await handlePost(req, res);
        } else {
            logger.warn('Method not allowed:', req.method);
            res.status(405).send('Method Not Allowed');
        }
    } catch (error) {
        logger.error('Error handling request:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
    const pr = req.query.pr as string;
    if (!pr) {
        res.status(400).json({ error: 'PR query parameter is required' });
        return;
    }

    logger.info('Fetching progress for PR:', pr);

    try {
        const result = await withConnection(async (connection) => {
            const [rows] = await connection.execute(
                'SELECT * FROM PR_Tracker WHERE PR = ?',
                [pr]
            );
            return rows;
        });

        const progress = Array.isArray(result) ? result[0] : null;
        logger.info('Progress fetched:', progress);
        res.status(200).json(progress || { error: 'PR not found' });
    } catch (error) {
        logger.error('Error fetching progress:', error);
        throw error;
    }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
    const { pr, progress, state } = req.body;
    if (!pr || !progress || !state) {
        res.status(400).json({ error: 'PR, progress, and state are required' });
        return;
    }

    const existingTimeout = debounceTimeouts.get(pr);
    if (existingTimeout) {
        clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(async () => {
        let connection;
        try {
            logger.info('Updating progress for PR:', pr, 'with progress:', progress, 'and state:', state);

            connection = await pool.getConnection();
            await connection.execute(
                'INSERT INTO PR_Tracker (PR, Progress, State) VALUES (?, ?, ?) ' +
                'ON DUPLICATE KEY UPDATE Progress = VALUES(Progress), State = VALUES(State)',
                [pr, progress, state]
            );

            logger.info('Progress updated for PR:', pr);
            debounceTimeouts.delete(pr);
        } catch (error) {
            logger.error('Error updating progress:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }, 1000);

    debounceTimeouts.set(pr, timeout);
    res.status(202).json({ message: 'Update scheduled' });
}

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, cleaning up...');
    for (const timeout of debounceTimeouts.values()) {
        clearTimeout(timeout);
    }
    await pool.end();
});