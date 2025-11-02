// Supabase Database Connection - Properly handles MySQL-style queries
// Uses Admin Client (Service Role) to bypass RLS
import { supabaseAdmin } from './supabase-admin';

// Database adapter that properly converts MySQL queries to Supabase operations
class SupabaseAdapter {
  /**
   * Execute a query (SELECT, INSERT, UPDATE, DELETE)
   * Returns data in MySQL format: [rows, fields]
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<[T[], any]> {
    try {
      console.log('🔍 SQL Query:', sql);
      console.log('🔍 Params:', params);

      // Clean up the SQL
      const cleanSql = sql.trim().replace(/\s+/g, ' ');
      const upperSql = cleanSql.toUpperCase();

      // Determine operation type
      let operation = 'SELECT';
      if (upperSql.startsWith('INSERT')) operation = 'INSERT';
      else if (upperSql.startsWith('UPDATE')) operation = 'UPDATE';
      else if (upperSql.startsWith('DELETE')) operation = 'DELETE';

      // Extract table name
      const table = this.extractTableName(cleanSql, operation);
      console.log('🔍 Table:', table, 'Operation:', operation);

      let result: any = { data: [], error: null };

      switch (operation) {
        case 'SELECT':
          result = await this.handleSelect(cleanSql, table, params);
          break;
        case 'INSERT':
          result = await this.handleInsert(cleanSql, table, params);
          break;
        case 'UPDATE':
          result = await this.handleUpdate(cleanSql, table, params);
          break;
        case 'DELETE':
          result = await this.handleDelete(cleanSql, table, params);
          break;
      }

      if (result.error) {
        console.error('Supabase query error:', result.error);
        throw result.error;
      }

      console.log('✅ Query result:', result.data ? `${result.data.length} rows` : '0 rows');
      
      // Return in MySQL format: [rows, fields]
      return [result.data || [], null];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Handle SELECT queries
   */
  private async handleSelect(sql: string, table: string, params: any[]) {
    const cleanSql = sql.replace(/`/g, ''); // Remove backticks
    
    // Extract columns
    let selectColumns = '*';
    const selectMatch = cleanSql.match(/SELECT\s+(.*?)\s+FROM/i);
    if (selectMatch) {
      selectColumns = selectMatch[1].trim();
    }

    // Start building query
    let query = supabaseAdmin.from(table).select(selectColumns);

    // Handle WHERE conditions
    const whereMatch = cleanSql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+LIMIT|\s+GROUP BY|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      query = this.applyWhereConditions(query, whereClause, params);
    }

    // Handle ORDER BY
    const orderMatch = cleanSql.match(/ORDER BY\s+(.+?)(?:\s+LIMIT|$)/i);
    if (orderMatch) {
      const orderClause = orderMatch[1].trim().replace(/`/g, '');
      const [column, direction = 'asc'] = orderClause.split(/\s+/);
      query = query.order(column, { ascending: direction.toLowerCase() === 'asc' });
    }

    // Handle LIMIT
    const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    }

    return await query;
  }

  /**
   * Handle INSERT queries
   */
  private async handleInsert(sql: string, table: string, params: any[]) {
    const cleanSql = sql.replace(/`/g, '');
    
    // Extract column names
    const columnsMatch = cleanSql.match(/\(([^)]+)\)\s+VALUES/i);
    if (!columnsMatch) {
      throw new Error('Could not parse INSERT statement');
    }

    const columns = columnsMatch[1].split(',').map(c => c.trim());
    
    // Build insert object
    const insertData: any = {};
    columns.forEach((col, index) => {
      insertData[col] = params[index] !== undefined ? params[index] : null;
    });

    console.log('📝 Insert data:', insertData);

    return await supabaseAdmin.from(table).insert(insertData).select();
  }

  /**
   * Handle UPDATE queries
   */
  private async handleUpdate(sql: string, table: string, params: any[]) {
    const cleanSql = sql.replace(/`/g, '').replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
    
    // Extract SET clause
    const setMatch = cleanSql.match(/SET\s+(.+?)\s+WHERE/i);
    if (!setMatch) {
      throw new Error('Could not parse UPDATE statement');
    }

    const setClause = setMatch[1].trim();
    const setPairs = setClause.split(',').map(s => s.trim());
    
    // Build update object
    const updateData: any = {};
    let paramIndex = 0;
    
    for (const pair of setPairs) {
      const [column, value] = pair.split('=').map(s => s.trim());
      
      if (value === '?') {
        updateData[column] = params[paramIndex] !== undefined ? params[paramIndex] : null;
        paramIndex++;
      } else if (value.toUpperCase().includes('CURRENT_TIMESTAMP')) {
        updateData[column] = new Date().toISOString();
      } else if (value.toUpperCase() === 'NULL') {
        // Handle NULL keyword - set to actual null, not string "NULL"
        updateData[column] = null;
      } else if (value.toUpperCase() === 'TRUE') {
        updateData[column] = true;
      } else if (value.toUpperCase() === 'FALSE') {
        updateData[column] = false;
      } else {
        // Handle literal values (strings)
        updateData[column] = value.replace(/^'|'$/g, '');
      }
    }

    console.log('📝 Update data:', updateData);

    // Extract WHERE clause
    const whereMatch = cleanSql.match(/WHERE\s+(.+)$/i);
    if (!whereMatch) {
      throw new Error('UPDATE without WHERE is not allowed');
    }

    const whereClause = whereMatch[1].trim();
    const whereParams = params.slice(paramIndex);
    
    let query = supabaseAdmin.from(table).update(updateData);
    query = this.applyWhereConditions(query, whereClause, whereParams);

    return await query.select();
  }

  /**
   * Handle DELETE queries
   */
  private async handleDelete(sql: string, table: string, params: any[]) {
    const cleanSql = sql.replace(/`/g, '');
    
    // Extract WHERE clause
    const whereMatch = cleanSql.match(/WHERE\s+(.+)$/i);
    if (!whereMatch) {
      throw new Error('DELETE without WHERE is not allowed');
    }

    const whereClause = whereMatch[1].trim();
    
    let query = supabaseAdmin.from(table).delete();
    query = this.applyWhereConditions(query, whereClause, params);

    return await query;
  }

  /**
   * Apply WHERE conditions to a query
   */
  private applyWhereConditions(query: any, whereClause: string, params: any[]) {
    const conditions = whereClause.split(/\s+AND\s+/i);
    let paramIndex = 0;

    for (const condition of conditions) {
      const trimmed = condition.trim().replace(/`/g, '');
      
      // Handle LOWER() comparisons first (case-insensitive)
      // Pattern: LOWER(column) = LOWER(?) or LOWER(column) = ?
      if (trimmed.toUpperCase().includes('LOWER(')) {
        const lowerMatch = trimmed.match(/LOWER\(([^)]+)\)\s*=\s*LOWER\(\?\)/i);
        if (lowerMatch) {
          // LOWER(column) = LOWER(?)
          const column = lowerMatch[1].trim();
          const value = params[paramIndex++];
          if (value !== undefined && value !== null) {
            // Use ilike for case-insensitive exact match
            query = query.ilike(column, value);
          }
        } else {
          // Try: LOWER(column) = ?
          const simpleMatch = trimmed.match(/LOWER\(([^)]+)\)\s*=\s*\?/i);
          if (simpleMatch) {
            const column = simpleMatch[1].trim();
            const value = params[paramIndex++];
            if (value !== undefined && value !== null) {
              query = query.ilike(column, value);
            }
          }
        }
        continue;
      }
      
      // Handle different operators
      if (trimmed.includes('!=')) {
        const [column, operator] = trimmed.split('!=').map(s => s.trim());
        if (operator === '?') {
          query = query.neq(column, params[paramIndex++]);
        }
      } else if (trimmed.includes('=')) {
        const [column, ...rest] = trimmed.split('=').map(s => s.trim());
        const operator = rest.join('=').trim();
        
        if (operator === '?') {
          const value = params[paramIndex++];
          if (value !== undefined && value !== null) {
            query = query.eq(column, value);
          }
        } else {
          // Literal value
          const value = operator.replace(/^'|'$/g, '');
          query = query.eq(column, value);
        }
      } else if (trimmed.includes('>=')) {
        const [column, operator] = trimmed.split('>=').map(s => s.trim());
        if (operator === '?') {
          query = query.gte(column, params[paramIndex++]);
        }
      } else if (trimmed.includes('<=')) {
        const [column, operator] = trimmed.split('<=').map(s => s.trim());
        if (operator === '?') {
          query = query.lte(column, params[paramIndex++]);
        }
      } else if (trimmed.includes('>')) {
        const [column, operator] = trimmed.split('>').map(s => s.trim());
        if (operator === '?') {
          query = query.gt(column, params[paramIndex++]);
        }
      } else if (trimmed.includes('<')) {
        const [column, operator] = trimmed.split('<').map(s => s.trim());
        if (operator === '?') {
          query = query.lt(column, params[paramIndex++]);
        }
      }
    }

    return query;
  }

  /**
   * Extract table name from SQL
   */
  private extractTableName(sql: string, operation: string): string {
    const cleanSql = sql.replace(/`/g, '');
    let match: RegExpMatchArray | null = null;

    switch (operation) {
      case 'SELECT':
        match = cleanSql.match(/FROM\s+(\w+)/i);
        break;
      case 'INSERT':
        match = cleanSql.match(/INSERT\s+INTO\s+(\w+)/i);
        break;
      case 'UPDATE':
        match = cleanSql.match(/UPDATE\s+(\w+)/i);
        break;
      case 'DELETE':
        match = cleanSql.match(/DELETE\s+FROM\s+(\w+)/i);
        break;
    }

    if (!match) {
      throw new Error(`Could not extract table name from SQL: ${sql}`);
    }

    return match[1];
  }

  /**
   * Execute raw query (for complex queries not covered by basic CRUD)
   */
  async execute(sql: string, params: any[] = []): Promise<any> {
    return await this.query(sql, params);
  }

  /**
   * Get connection (for compatibility - Supabase doesn't need connections)
   */
  async getConnection() {
    return this;
  }

  /**
   * Release connection (for compatibility - no-op for Supabase)
   */
  release() {
    // No-op for Supabase
  }
}

// Export singleton instance
const db = new SupabaseAdapter();

// Test connection on startup
(async () => {
  try {
    await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    console.log('✅ Supabase Admin connected successfully (Service Role)');
  } catch (err: any) {
    console.error('❌ Supabase connection error:', err.message);
  }
})();

export default db;

// Export Supabase admin client for direct use when needed
export { supabaseAdmin } from './supabase-admin';
