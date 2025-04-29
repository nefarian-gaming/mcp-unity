import { Logger } from '../utils/logger.js';
import { McpUnity } from '../unity/mcpUnity.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Creates and registers the Create New Scene tool with the MCP server.
 * Internally uses the C# 'create_lit2d_scene' tool to create a scene based on the Lit2DSceneTemplate.
 *
 * @param server The MCP server instance to register with
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param logger The logger instance for diagnostic information
 */
export declare function createCreateSceneTool(server: McpServer, mcpUnity: McpUnity, logger: Logger): void;
