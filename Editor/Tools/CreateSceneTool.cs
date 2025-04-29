using System;
using System.IO; // Required for Path
using System.Linq;
using McpUnity.Unity;
using McpUnity.Utils;
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneTemplate; // Required for Scene Templates
using Newtonsoft.Json.Linq;

namespace McpUnity.Tools
{
    /// <summary>
    /// Tool for creating a new Unity scene from a specified Scene Template.
    /// </summary>
    public class CreateSceneTool : McpToolBase
    {
        public CreateSceneTool()
        {
            Name = "create_scene_from_template";
            Description = "Creates a new scene using a specified Scene Template asset.";
        }

        /// <summary>
        /// Execute the Create Scene From Template tool with the provided parameters synchronously.
        /// </summary>
        /// <param name="parameters">Tool parameters as a JObject.</param>
        public override JObject Execute(JObject parameters)
        {
            // Extract parameters
            string templateName = parameters["templateName"]?.ToObject<string>();
            string scenePath = parameters["scenePath"]?.ToObject<string>(); // Optional: path to save the new scene

            if (string.IsNullOrEmpty(templateName))
            {
                return McpUnitySocketHandler.CreateErrorResponse(
                    "Required parameter 'templateName' not provided (e.g., 'Basic 2D (Built-in)')",
                    "validation_error"
                );
            }

            // Log the execution attempt
            McpLogger.LogInfo($"[MCP Unity] Attempting to create scene from template: '{templateName}'{(string.IsNullOrEmpty(scenePath) ? "" : $" at path: '{scenePath}'")}");

            try
            {
                // Find the specified scene template asset
                var templates = SceneTemplateAsset.GetTemplateAssets();
                SceneTemplateAsset foundTemplate = templates.FirstOrDefault(t => 
                    t.name.Equals(templateName, StringComparison.OrdinalIgnoreCase) || 
                    GetTemplateDisplayName(t).Equals(templateName, StringComparison.OrdinalIgnoreCase));

                if (foundTemplate == null)
                {
                    string availableTemplates = string.Join(", ", templates.Select(t => $"'{GetTemplateDisplayName(t)}' ('{t.name}')"));
                    McpLogger.LogError($"[MCP Unity] Scene template '{templateName}' not found. Available templates: {availableTemplates}");
                    return McpUnitySocketHandler.CreateErrorResponse(
                        $"Scene template '{templateName}' not found. Available templates: {availableTemplates}",
                        "not_found_error"
                    );
                }

                McpLogger.LogInfo($"[MCP Unity] Found template asset: {foundTemplate.name}");

                // Instantiate the scene from the template
                // Instantiate returns the SceneTemplateResult which might be useful later, but for now we just check for success.
                // The 'false' argument for 'loadAdditively' means it creates a new scene, replacing the current one (prompts for save).
                SceneTemplateService.Instantiate(foundTemplate, false, scenePath); // Pass scenePath directly

                string successMessage = $"Successfully initiated scene creation from template '{templateName}'.";
                if (!string.IsNullOrEmpty(scenePath))
                {
                    successMessage += $" Scene saved at '{scenePath}'.";
                }
                else
                {
                    successMessage += " The new scene is currently unsaved.";
                }

                 McpLogger.LogInfo($"[MCP Unity] {successMessage}");

                // Create the success response
                return new JObject
                {
                    ["success"] = true,
                    ["type"] = "text",
                    ["message"] = successMessage
                };
            }
            catch (Exception ex)
            {
                McpLogger.LogError($"[MCP Unity] Error creating scene from template '{templateName}': {ex.Message}
{ex.StackTrace}");
                return McpUnitySocketHandler.CreateErrorResponse(
                    $"Error creating scene from template '{templateName}': {ex.Message}",
                    "execution_error"
                );
            }
        }

        /// <summary>
        /// Helper method to safely get the display name of a SceneTemplateAsset.
        /// Uses reflection as the 'template' property and its 'displayName' are internal.
        /// </summary>
        private string GetTemplateDisplayName(SceneTemplateAsset templateAsset)
        {
             if (templateAsset == null) return string.Empty;

            try
            {
                // Access the internal 'template' property
                var templateInfoProp = typeof(SceneTemplateAsset).GetProperty("template", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                if (templateInfoProp != null)
                {
                    var templateInfo = templateInfoProp.GetValue(templateAsset);
                    if (templateInfo != null)
                    {
                        // Access the internal 'displayName' property of the TemplateInfo object
                        var displayNameProp = templateInfo.GetType().GetProperty("displayName");
                        if (displayNameProp != null)
                        {
                            return displayNameProp.GetValue(templateInfo) as string ?? templateAsset.name; // Fallback to asset name
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                McpLogger.LogWarning($"[MCP Unity] Reflection error getting display name for template '{templateAsset.name}': {ex.Message}");
            }

            // Fallback to the asset's direct name if reflection fails
            return templateAsset.name;
        }
    }
} 