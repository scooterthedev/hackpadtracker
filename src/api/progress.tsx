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
    port: 3307
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const db = await mysql.createConnection(dbConfig);

    try {
        if (req.method === 'GET') {
            const pr = req.query.pr as string;
            logger.info('Fetching progress for PR:', pr);
            const [rows]: any[] = await db.execute('SELECT * FROM PR_Tracker WHERE PR = ?', [pr]);
            logger.info('Progress fetched:', rows[0]);
            res.status(200).json(rows[0]);
        } else if (req.method === 'POST') {
            const { pr, progress, state } = req.body;
            logger.info('Updating progress for PR:', pr, 'with progress:', progress, 'and state:', state);
            await db.execute(
                'INSERT INTO PR_Tracker (PR, Progress, State) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Progress = ?, State = ?',
                [pr, progress, state, progress, state]
            );
            logger.info('Progress updated for PR:', pr);
            res.status(200).send('Progress updated');
        } else {
            logger.warn('Method not allowed:', req.method);
            res.status(405).send('Method Not Allowed');
        }
    } catch (error) {
        logger.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        await db.end();
    }
}