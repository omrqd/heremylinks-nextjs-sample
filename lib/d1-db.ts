// Cloudflare D1 Database Connection
// This will be used in edge runtime and API routes

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  success: boolean;
  results: T[];
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// Get D1 database instance
export function getD1Database(): D1Database {
  // In edge runtime (Cloudflare Workers)
  if (typeof process !== 'undefined' && process.env.DB) {
    return (process.env as any).DB as D1Database;
  }
  
  // For local development with wrangler
  if (typeof globalThis !== 'undefined' && (globalThis as any).DB) {
    return (globalThis as any).DB as D1Database;
  }
  
  throw new Error('D1 Database not available. Make sure you are running in Cloudflare Workers environment.');
}

// Helper function to execute queries with proper error handling
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const db = getD1Database();
    const stmt = db.prepare(query);
    
    if (params.length > 0) {
      const result = await stmt.bind(...params).all<T>();
      return result.results;
    }
    
    const result = await stmt.all<T>();
    return result.results;
  } catch (error) {
    console.error('D1 Query Error:', error);
    throw error;
  }
}

// Helper function to execute single row queries
export async function executeQueryFirst<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const db = getD1Database();
    const stmt = db.prepare(query);
    
    if (params.length > 0) {
      return await stmt.bind(...params).first<T>();
    }
    
    return await stmt.first<T>();
  } catch (error) {
    console.error('D1 Query Error:', error);
    throw error;
  }
}

// Helper function to execute mutations (INSERT, UPDATE, DELETE)
export async function executeMutation(
  query: string,
  params: any[] = []
): Promise<D1Result> {
  try {
    const db = getD1Database();
    const stmt = db.prepare(query);
    
    if (params.length > 0) {
      return await stmt.bind(...params).run();
    }
    
    return await stmt.run();
  } catch (error) {
    console.error('D1 Mutation Error:', error);
    throw error;
  }
}

// Helper function for batch operations
export async function executeBatch(queries: { query: string; params: any[] }[]): Promise<D1Result[]> {
  try {
    const db = getD1Database();
    const statements = queries.map(({ query, params }) => {
      const stmt = db.prepare(query);
      return params.length > 0 ? stmt.bind(...params) : stmt;
    });
    
    return await db.batch(statements);
  } catch (error) {
    console.error('D1 Batch Error:', error);
    throw error;
  }
}

export default {
  getD1Database,
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
};

