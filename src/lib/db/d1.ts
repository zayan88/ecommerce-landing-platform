/**
 * Cloudflare D1 client (orders / transactional data).
 *
 * Two modes, mirroring src/lib/db/kv.ts:
 *  - native binding `DB` taken from the Cloudflare request context (production on Pages);
 *  - local development: `D1_REST_BASE_URL` points at scripts/dev-d1-server.mjs (node:sqlite emulator),
 *    because `next dev` cannot see bindings.
 *
 * Security: this module only ever sends a statement together with its bound parameters.
 * There is no API here to interpolate values into SQL, and nothing (SQL text, parameters) is logged.
 * Edge-safe: Web APIs only, no imports.
 */

export type SqlParam = string | number | null;
export interface SqlStatement {
  sql: string;
  params?: SqlParam[];
}
export interface SqlResult<T = Record<string, any>> {
  rows: T[];
}
export interface SqlClient {
  /** One prepared statement with bound parameters. Throws on failure. */
  query<T = Record<string, any>>(sql: string, params?: SqlParam[]): Promise<SqlResult<T>>;
  /** Several prepared statements in ONE transaction (all or nothing). Counts as one D1 query. */
  batch(statements: SqlStatement[]): Promise<SqlResult[]>;
}

export class D1UnavailableError extends Error {
  constructor(message = "D1 is not configured (no DB binding and no D1_REST_BASE_URL)") {
    super(message);
    this.name = "D1UnavailableError";
  }
}

function getNativeD1(): any {
  try {
    const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
    return ctx?.env?.DB || (globalThis as any)?.DB || null;
  } catch {
    return null;
  }
}

function safeMessage(err: unknown): string {
  // SQLite/D1 messages name tables/constraints, never bound values.
  const m = err instanceof Error ? err.message : String(err);
  return m.slice(0, 200);
}

export function createNativeD1Client(db: any): SqlClient {
  const prepare = (s: SqlStatement) => {
    const stmt = db.prepare(s.sql);
    return s.params && s.params.length > 0 ? stmt.bind(...s.params) : stmt;
  };
  return {
    async query<T>(sql: string, params: SqlParam[] = []) {
      try {
        const res = await prepare({ sql, params }).all();
        return { rows: (res?.results || []) as T[] };
      } catch (err) {
        throw new Error(`D1 query failed: ${safeMessage(err)}`);
      }
    },
    async batch(statements: SqlStatement[]) {
      if (statements.length === 0) return [];
      try {
        const res = await db.batch(statements.map(prepare));
        return (res || []).map((r: any) => ({ rows: r?.results || [] }));
      } catch (err) {
        throw new Error(`D1 batch failed: ${safeMessage(err)}`);
      }
    },
  };
}

/** Client for the local emulator (scripts/dev-d1-server.mjs). Never used against real Cloudflare. */
export function createRestD1Client(baseUrl: string): SqlClient {
  const base = baseUrl.trim().replace(/\/+$/, "");
  const post = async (path: string, body: unknown): Promise<any> => {
    const res = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok || !data || data.success !== true) {
      throw new Error(`D1 ${path} failed: ${String(data?.error || res.status).slice(0, 200)}`);
    }
    return data;
  };
  return {
    async query<T>(sql: string, params: SqlParam[] = []) {
      const data = await post("/query", { sql, params });
      return { rows: (data.results || []) as T[] };
    },
    async batch(statements: SqlStatement[]) {
      if (statements.length === 0) return [];
      const data = await post("/batch", {
        statements: statements.map((s) => ({ sql: s.sql, params: s.params || [] })),
      });
      return (data.results || []).map((r: any) => ({ rows: r?.results || [] }));
    },
  };
}

/** Native binding first, then the local emulator. null = D1 is not configured. Read per call. */
export function getD1Client(): SqlClient | null {
  const native = getNativeD1();
  if (native && typeof native.prepare === "function") return createNativeD1Client(native);
  const local = (process.env.D1_REST_BASE_URL || "").trim();
  if (local) return createRestD1Client(local);
  return null;
}

export function isD1Available(): boolean {
  return getD1Client() !== null;
}
