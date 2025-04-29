import { z } from 'zod';
import { Logger } from '../utils/logger.js';
import { McpUnity } from '../unity/mcpUnity.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpUnityError, ErrorType } from '../utils/errors.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Constants for the tool
const toolNameForMcpServer = 'create_new_scene'; // Name exposed to the AI model
const toolDescription = 'Creates a new Unity scene, defaulting to a standard 2D Lit URP setup.';
const unityMethodName = 'create_lit2d_scene'; // Actual method name expected by the C# tool

const paramsSchema = z.object({
  scenePath: z.string().optional().describe('Optional. The relative path within Assets/ where the new scene should be saved (e.g., "Assets/Scenes/MyNewScene.unity"). If omitted, a default path based on the template will be used.')
});

/**
 * Creates and registers the Create New Scene tool with the MCP server.
 * Internally uses the C# 'create_lit2d_scene' tool to create a scene based on the Lit2DSceneTemplate.
 *
 * @param server The MCP server instance to register with
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param logger The logger instance for diagnostic information
 */
export function createCreateSceneTool(server: McpServer, mcpUnity: McpUnity, logger: Logger) {
  logger.info(`Registering tool: ${toolNameForMcpServer} (maps to Unity method: ${unityMethodName})`);

  // Register this tool with the MCP server using the desired external name
  server.tool(
    toolNameForMcpServer,
    toolDescription,
    paramsSchema.shape,
    async (params: any) => {
      try {
        logger.info(`Executing tool: ${toolNameForMcpServer}`, params);
        // Pass the actual Unity method name to the handler
        const result = await toolHandler(mcpUnity, params, unityMethodName);
        logger.info(`Tool execution successful: ${toolNameForMcpServer}`);
        return result;
      } catch (error) {
        logger.error(`Tool execution failed: ${toolNameForMcpServer}`, error);
        throw error;
      }
    }
  );
}

/**
 * Handles scene creation requests by calling the specific Unity method.
 *
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param params The parameters for the tool (only scenePath is expected)
 * @param unityMethod The exact method name to call in the Unity C# code
 * @returns A promise that resolves to the tool execution result
 * @throws McpUnityError if the request to Unity fails
 */
async function toolHandler(mcpUnity: McpUnity, params: any, unityMethod: string): Promise<CallToolResult> {
  const { scenePath } = params;

  // Prepare parameters, only including scenePath if it's provided
  const unityParams: { scenePath?: string } = {};
  if (scenePath) {
    unityParams.scenePath = scenePath;
  }

  const response = await mcpUnity.sendRequest({
    method: unityMethod, // Use the specific method name required by C#
    params: unityParams
  });

  if (!response.success) {
    throw new McpUnityError(
      ErrorType.TOOL_EXECUTION,
      response.message || `Failed to execute scene creation in Unity (method: ${unityMethod}).`
    );
  }

  return {
    content: [{
      type: response.type || 'text', // Default to text if type is missing
      text: response.message || `Successfully initiated scene creation.`
    }]
  };
}