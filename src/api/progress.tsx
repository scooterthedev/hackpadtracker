import { NextRequest, NextResponse } from 'next/server';
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

export const config = {
    runtime: 'edge',
};

export default async function handler(req: NextRequest) {
    const db = await mysql.createConnection(dbConfig);

    try {
        if (req.method === 'GET') {
            const pr = req.nextUrl.searchParams.get('pr');
            logger.info('Fetching progress for PR:', pr);
            const [rows]: any[] = await db.execute('SELECT * FROM PR_Tracker WHERE PR = ?', [pr]);
            logger.info('Progress fetched:', rows[0]);
            return NextResponse.json(rows[0]);
        } else if (req.method === 'POST') {
            const { pr, progress, state } = await req.json();
            logger.info('Updating progress for PR:', pr, 'with progress:', progress, 'and state:', state);
            await db.execute(
                'INSERT INTO PR_Tracker (PR, Progress, State) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Progress = ?, State = ?',
                [pr, progress, state, progress, state]
            );
            logger.info('Progress updated for PR:', pr);
            return new NextResponse('Progress updated', { status: 200 });
        } else {
            logger.warn('Method not allowed:', req.method);
            return new NextResponse('Method Not Allowed', { status: 405 });
        }
    } catch (error) {
        logger.error('Error handling request:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    } finally {
        await db.end();
    }
}