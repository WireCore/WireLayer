#!/usr/bin/env node
// Starts the server on stdin/stdout:  claude mcp add wirelayer -- npx -y -p @wirecore/wirelayer-mcp wirelayer-mcp
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

await createServer().connect(new StdioServerTransport());
