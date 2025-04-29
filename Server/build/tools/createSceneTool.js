import { z } from 'zod';
import { McpUnityError, ErrorType } from '../utils/errors.js';
// Constants for the tool
const toolName = 'create_scene_from_template';
const toolDescription = 'Creates a new Unity scene using a specified Scene Template asset.';
const paramsSchema = z.object({
    templateName: z.string().describe('The name of the Scene Template to use (e.g., "Basic 2D (Built-in)", "MinimalSetupTemplate")'),
    scenePath: z.string().optional().describe('Optional. The relative path within Assets/ where the new scene should be saved (e.g., "Assets/Scenes/MyNewScene.unity"). If omitted, the scene remains unsaved.')
});
/**
 * Creates and registers the Create Scene From Template tool with the MCP server.
 * This tool allows creating new scenes in Unity based on templates.
 *
 * @param server The MCP server instance to register with
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param logger The logger instance for diagnostic information
 */
export function createCreateSceneTool(server, mcpUnity, logger) {
    logger.info(`Registering tool: ${toolName}`);
    // Register this tool with the MCP server
    server.tool(toolName, toolDescription, paramsSchema.shape, async (params) => {
        try {
            logger.info(`Executing tool: ${toolName}`, params);
            const result = await toolHandler(mcpUnity, params);
            logger.info(`Tool execution successful: ${toolName}`);
            return result;
        }
        catch (error) {
            logger.error(`Tool execution failed: ${toolName}`, error);
            throw error;
        }
    });
}
/**
 * Handles scene creation requests.
 *
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param params The parameters for the tool
 * @returns A promise that resolves to the tool execution result
 * @throws McpUnityError if the request to Unity fails
 */
async function toolHandler(mcpUnity, params) {
    const { templateName, scenePath } = params;
    // Prepare parameters, only including scenePath if it's provided
    const unityParams = { templateName };
    if (scenePath) {
        unityParams.scenePath = scenePath;
    }
    const response = await mcpUnity.sendRequest({
        method: toolName,
        params: unityParams
    });
    if (!response.success) {
        throw new McpUnityError(ErrorType.TOOL_EXECUTION, response.message || `Failed to create scene from template: ${templateName}`);
    }
    return {
        content: [{
                type: response.type || 'text', // Default to text if type is missing
                text: response.message || `Successfully initiated scene creation from template: ${templateName}`
            }]
    };
}
