import axios from 'axios';
import { DatabaseService } from './DatabaseService';
import { logger } from '../config/database';

export interface PRProgress {
    progress: number;
    state: string;
}

export class PRStorageService {
    API_BASE_URL: string;
    dbService: DatabaseService;

    constructor(dbService: DatabaseService) {
        this.API_BASE_URL = 'https://hackpad-eta.vercel.app/api/progress';
        this.dbService = dbService;
    }
 
    private extractPRNumber(prUrl: string): string {
        const matches = prUrl.match(/\/pull\/(\d+)/);
        if (!matches) {
            logger.warn('Failed to extract PR number from URL', { prUrl });
            throw new Error(`Invalid PR URL format: ${prUrl}`);
        }
        return matches[1];
    }

    async getPRProgress(pr: string): Promise<PRProgress | null> {
        const prNumber = this.extractPRNumber(pr);
        
        try {
            const response = await axios.get<PRProgress>(`${this.API_BASE_URL}/progress`, {
                params: { pr: prNumber },
                timeout: 5000
            });
            
            logger.info('Successfully fetched PR progress', { prNumber });
            return response.data;
        } catch (error) {
            this.handleAxiosError('fetching', prNumber, error);
            return null;
        }
    }

    async savePRProgress(pr: string, progress: number, state: string): Promise<PRProgress> {
        const prNumber = this.extractPRNumber(pr);
        
        try {
            const response = await axios.post<PRProgress>(
                `${this.API_BASE_URL}/progress`,
                { pr: prNumber, progress, state },
                { timeout: 5000 }
            );
            
            logger.info('Successfully updated PR progress', { prNumber, progress, state });
            return response.data;
        } catch (error) {
            this.handleAxiosError('updating', prNumber, error);
            throw error;
        }
    }

    private handleAxiosError(operation: string, prNumber: string, error: unknown): void {
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
} 