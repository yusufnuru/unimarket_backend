import { db } from '../config/db.js';

export type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];
