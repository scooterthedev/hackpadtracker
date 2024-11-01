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
    connectTimeout: 10000, // 10 seconds
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create a connection pool instead of single connections
const pool = mysql.createPool(dbConfig);

// Helper function to validate PR data
function validatePRData(pr: string, progress: number, state: string): string | null {
    if (!pr) return 'PR is required';
    if (progress === undefined || progress < 0 || progress > 100) return 'Progress must be between 0 and 100';
    if (!state) return 'State is required';
    return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Get a connection from the pool
    let conn;

    try {
        if (req.method === 'GET') {
            const pr = req.query.pr as string;

            if (!pr) {
                logger.warn('PR parameter missing');
                return res.status(400).json({ error: 'PR parameter is required' });
            }

            logger.info('Fetching progress for PR:', pr);
            conn = await pool.getConnection();

            const [rows] = await conn.execute<mysql.RowDataPacket[]>(
                'SELECT * FROM PR_Tracker WHERE PR = ?',
                [pr]
            );

            if (rows.length > 0) {
                logger.info('Progress fetched:', rows[0]);
                return res.status(200).json(rows[0]);
            } else {
                logger.info('PR not found:', pr);
                return res.status(404).json({ error: 'PR not found' });
            }
        }
        else if (req.method === 'POST') {
            const { pr, progress, state } = req.body;

            // Validate input
            const validationError = validatePRData(pr, progress, state);
            if (validationError) {
                logger.warn('Validation error:', validationError, req.body);
                return res.status(400).json({ error: validationError });
            }

            logger.info(`Updating progress for PR: ${pr} with progress: ${progress} and state: ${state}`);
            conn = await pool.getConnection();

            // Use a transaction for atomicity
            await conn.beginTransaction();

            try {
                await conn.execute(
                    `INSERT INTO PR_Tracker (PR, Progress, State)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                         Progress = VALUES(Progress),
                         State = VALUES(State)`,
                    [pr, progress, state]
                );

                await conn.commit();
                logger.info('Progress updated successfully for PR:', pr);
                return res.status(200).json({ message: 'Progress updated successfully' });
            } catch (error) {
                await conn.rollback();
                throw error;
            }
        }
        else {
            logger.warn('Method not allowed:', req.method);
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error('Error handling request:', error);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } else {
            logger.error('Unknown error:', error);
            return res.status(500).json({
                error: 'Internal Server Error'
            });
        }
    } finally {
        if (conn) {
            conn.release(); // Release the connection back to the pool
        }
    }
}