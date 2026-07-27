import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import { z } from "zod";

// Config
const DATABASE_URL = process.env.SUPABASE_DB_URL;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL) {
  console.error("SUPABASE_DB_URL environment variable is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });

// Schema for tool arguments
const SqlQuerySchema = z.object({
  query: z.string().describe("SQL query to execute"),
  params: z.array(z.any()).optional().describe("Query parameters"),
});

const ListTablesSchema = z.object({});

const DescribeTableSchema = z.object({
  table: z.string().describe("Table name to describe"),
});

const ListMigrationsSchema = z.object({});

// Create MCP server
const server = new Server(
  {
    name: "supabase-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "execute_sql",
      description: "Execute a SQL query on the Supabase database",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "SQL query to execute" },
          params: {
            type: "array",
            items: {},
            description: "Query parameters (optional)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "list_tables",
      description: "List all tables in the database",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "describe_table",
      description: "Describe the structure of a specific table",
      inputSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name to describe" },
        },
        required: ["table"],
      },
    },
    {
      name: "list_migrations",
      description: "List all database migrations",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "run_migration",
      description: "Run raw SQL migration on the database",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL migration to execute" },
        },
        required: ["sql"],
      },
    },
  ],
}));

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "execute_sql": {
        const { query, params } = SqlQuerySchema.parse(args);
        console.error(`Executing SQL: ${query.substring(0, 100)}...`);
        const result = await pool.query(query, params || []);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  rows: result.rows,
                  rowCount: result.rowCount,
                  fields: result.fields?.map((f) => ({
                    name: f.name,
                    dataType: f.dataTypeID,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_tables": {
        ListTablesSchema.parse(args || {});
        const result = await pool.query(`
          SELECT 
            schemaname, 
            tablename, 
            tableowner,
            tableowner = CURRENT_USER as is_accessible
          FROM pg_catalog.pg_tables 
          WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          ORDER BY schemaname, tablename
        `);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.rows, null, 2),
            },
          ],
        };
      }

      case "describe_table": {
        const { table } = DescribeTableSchema.parse(args);
        const result = await pool.query(
          `
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            tc.constraint_type,
            c.character_maximum_length,
            c.ordinal_position
          FROM information_schema.columns c
          LEFT JOIN information_schema.key_column_usage kcu 
            ON c.table_name = kcu.table_name 
            AND c.column_name = kcu.column_name
            AND c.table_schema = kcu.table_schema
          LEFT JOIN information_schema.table_constraints tc 
            ON kcu.constraint_name = tc.constraint_name
            AND kcu.table_schema = tc.table_schema
          WHERE c.table_name = $1
          ORDER BY c.ordinal_position
        `,
          [table]
        );

        // Get indexes
        const indexes = await pool.query(
          `
          SELECT
            indexname,
            indexdef
          FROM pg_indexes
          WHERE tablename = $1
        `,
          [table]
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { columns: result.rows, indexes: indexes.rows },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_migrations": {
        try {
          const result = await pool.query(`
            SELECT * FROM supabase_migrations.schema_migrations 
            ORDER BY version DESC
          `);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.rows, null, 2),
              },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  note: "No supabase_migrations table found or not accessible",
                  migrations: [],
                }, null, 2),
              },
            ],
          };
        }
      }

      case "run_migration": {
        const { sql } = z.object({ sql: z.string() }).parse(args);
        console.error(`Running migration...`);
        await pool.query(sql);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, message: "Migration executed successfully" }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error.message,
            stack: error.stack,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Supabase MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});