import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  withTransaction,
} from "./transactions";

/**
 * MySQL adapter implementation
 */
export class MySQLDrizzleAdapter implements MySQLAdapter {
  // ... existing properties and methods ...

  /**
   * Begin a new transaction
   */
  async beginTransaction(): Promise<PoolConnection> {
    return beginTransaction(this);
  }

  /**
   * Commit an active transaction
   */
  async commitTransaction(connection: PoolConnection): Promise<void> {
    return commitTransaction(connection);
  }

  /**
   * Rollback an active transaction
   */
  async rollbackTransaction(connection: PoolConnection): Promise<void> {
    return rollbackTransaction(connection);
  }

  /**
   * Execute a function within a transaction
   */
  async withTransaction<T>(
    fn: (connection: PoolConnection) => Promise<T>,
  ): Promise<TransactionResult<T>> {
    return withTransaction(this, fn);
  }

  // ... rest of class ...
}
