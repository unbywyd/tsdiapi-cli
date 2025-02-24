import { PluginMetadata } from './plugins-configuration';
export declare const addPlugin: (selectedPluginName: string) => Promise<void>;
export declare function getPluginMetaDataFromRoot(packagePath: string): Promise<any>;
export declare function getPluginMetadata(currentDirectory: string, packageName: string): Promise<PluginMetadata | null>;
export declare function addPluginToApp(filePath: string, pluginName: string, pluginImportPath: string, projectDir: string): Promise<boolean>;
/**
 * Finds the root directory of the nearest project containing "@tsdiapi/server" in its dependencies.
 *
 * @returns The root directory path of the TSDIAPI-Server project or null if not found.
 */
export declare function findTSDIAPIServerProject(cwd?: string): Promise<string | null>;
export declare function isPackageInstalled(projectPath: string, packageName: string): boolean;
/**
 * Updates an installed plugin in the current TSDIAPI project.
 *
 * @param {string} pluginName - The name of the plugin to update.
 * @returns {Promise<void>} - A promise that resolves after the plugin is updated.
 */
export declare const updatePlugin: (pluginName: string) => Promise<void>;
/**
 * Removes a plugin from the current TSDIAPI project.
 *
 * @param {string} pluginName - The name of the plugin to remove.
 * @returns {Promise<void>} - A promise that resolves after the plugin is removed.
 */
export declare const removePlugin: (pluginName: string) => Promise<void>;
//# sourceMappingURL=plugins.d.ts.map