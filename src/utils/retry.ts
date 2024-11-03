import { logger } from '../config/database';

export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
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
} 