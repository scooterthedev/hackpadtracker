import { Pool, QueryResult } from 'pg';
import { logger } from '../config/database';

export class DatabaseService {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
        this.setupPoolListeners();
    }

    private setupPoolListeners(): void {
        this.pool.on('connect', client => {
            logger.info('Database connection established', {
                clientId: client.processID,
                poolStats: this.getPoolStats()
            });
        });

        this.pool.on('error', (err, client) => {
            logger.error('Database pool error', {
                error: {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                },
                clientId: client?.processID,
                poolStats: this.getPoolStats()
            });
        });

        this.pool.on('remove', client => {
            logger.info('Database connection removed', {
                clientId: client.processID,
                poolStats: this.getPoolStats()
            });
        });
    }

    private getPoolStats() {
        return {
            total: this.pool.totalCount,
            idle: this.pool.idleCount,
            waiting: this.pool.waitingCount
        };
    }

    async query<T = any>(queryText: string, values?: any[]): Promise<QueryResult<T>> {
        const startTime = process.hrtime();
        
        try {
            const result = await this.pool.query<T>(queryText, values);
            this.logQuerySuccess(startTime, queryText, result);
            return result;
        } catch (error) {
            this.logQueryError(startTime, queryText, error);
            throw error;
        }
    }

    private logQuerySuccess(startTime: [number, number], query: string, result: QueryResult): void {
        const duration = this.calculateDuration(startTime);
        logger.info('Query executed successfully', {
            query,
            duration: `${duration.toFixed(2)}ms`,
            rowCount: result.rowCount
        });
    }

    private logQueryError(startTime: [number, number], query: string, error: unknown): void {
        const duration = this.calculateDuration(startTime);
        logger.error('Query execution failed', {
            query,
            duration: `${duration.toFixed(2)}ms`,
            error: {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });
    }

    private calculateDuration(startTime: [number, number]): number {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        return seconds * 1000 + nanoseconds / 1000000;
    }
} 