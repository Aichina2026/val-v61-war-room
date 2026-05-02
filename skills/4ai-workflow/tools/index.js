/**
 * Tool Definitions for 4AI Workflow
 * MCP-compatible tool schemas
 */

const SYSTEM_TOOLS = {
  // Memory Search Tool
  memory_search: {
    name: "memory_search",
    description: "Search through MEMORY.md and memory files for relevant context",
    annotations: {
      title: "Memory Search",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        maxResults: { type: "number", default: 10 },
        corpus: { type: "string", enum: ["memory", "sessions", "all"], default: "all" }
      },
      required: ["query"]
    }
  },

  // Web Search Tool
  web_search: {
    name: "web_search",
    description: "Search the web for latest information",
    annotations: {
      title: "Web Search",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        count: { type: "number", default: 5 },
        region: { type: "string", default: "us-en" }
      },
      required: ["query"]
    }
  },

  // Web Fetch Tool
  web_fetch: {
    name: "web_fetch",
    description: "Fetch and extract content from a URL",
    annotations: {
      title: "Web Fetch",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    },
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to fetch" },
        extractMode: { type: "string", enum: ["markdown", "text"], default: "markdown" },
        maxChars: { type: "number", default: 10000 }
      },
      required: ["url"]
    }
  },

  // Database Query Tool
  query_database: {
    name: "query_database",
    description: "Execute read-only SQL query",
    annotations: {
      title: "Database Query",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query (read-only)" },
        params: { type: "array", items: { type: "string" } }
      },
      required: ["query"]
    }
  },

  // Code Execution Tool
  execute_code: {
    name: "execute_code",
    description: "Execute code in sandbox environment",
    annotations: {
      title: "Code Execution",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false
    },
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Code to execute" },
        language: { type: "string", enum: ["python", "javascript", "bash"], default: "python" },
        timeout: { type: "number", default: 30 }
      },
      required: ["code"]
    }
  },

  // Security Verification Tool
  verify_security: {
    name: "verify_security",
    description: "Static security analysis of code",
    annotations: {
      title: "Security Verification",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true
    },
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Code to analyze" },
        language: { type: "string", default: "javascript" }
      },
      required: ["code"]
    }
  }
};

module.exports = { SYSTEM_TOOLS };
