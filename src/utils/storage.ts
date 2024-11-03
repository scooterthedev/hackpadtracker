import { pool } from '../config/database';
import { DatabaseService } from '../services/DatabaseService';
import { PRStorageService } from '../services/PRStorageService';

const dbService = new DatabaseService(pool);
export const prStorage = new PRStorageService(dbService);
export { withRetry } from '../utils/retry';