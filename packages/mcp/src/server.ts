// MCP server for AI assistants (Claude Code, Cursor …): looks up WireLayer components, their props and the guides.
import { readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createTools, type Collected } from './tools.js';

const data = JSON.parse(readFileSync(new URL('../data/components.json', import.meta.url), 'utf8')) as Collected;
const framework = z
    .enum(['web', 'native'])
    .describe('"web" (Vue and React, default) or "native" (React Native, @wirecore/wirelayer-native)');

export function createServer() {
    const tools = createTools(data);
    const server = new McpServer({ name: 'wirelayer', version: '0.0.0' });
    const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] });
    server.registerTool(
        'list_components',
        {
            title: 'List WireLayer components',
            description:
                'All components of the WireLayer library (Vue and React, or React Native with framework "native"), optionally of one category',
            inputSchema: {
                category: z.string().optional().describe('e.g. "Forms", "Data", "Overlays"'),
                framework: framework.optional(),
            },
        },
        ({ category, framework: target }) => text(tools.list(category, target))
    );
    server.registerTool(
        'get_component',
        {
            title: 'Get a WireLayer component',
            description:
                'Props (React and Vue names, types, descriptions), import path and story of one component; framework "native" gives the React Native component',
            inputSchema: {
                name: z.string().describe('Component name, e.g. "DataTable"'),
                framework: framework.optional(),
            },
        },
        ({ name, framework: target }) => text(tools.get(name, target))
    );
    server.registerTool(
        'search_components',
        {
            title: 'Search WireLayer components',
            description:
                'Components whose name, description or props match the words (framework "native": React Native)',
            inputSchema: { query: z.string().describe('e.g. "date range" or "drag"'), framework: framework.optional() },
        },
        ({ query, framework: target }) => text(tools.search(query, target))
    );
    server.registerTool(
        'get_guide',
        {
            title: 'Get a WireLayer guide',
            description: 'Setup and usage guides (installation, Nuxt, Next.js, themes, languages, customizing …)',
            inputSchema: { topic: z.string().optional().describe('Guide id or words of its title; empty lists all') },
        },
        ({ topic }) => text(tools.guide(topic))
    );
    return server;
}
