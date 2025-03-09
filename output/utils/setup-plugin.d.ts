import { PluginFileMapping, PluginMetadata } from './plugins-configuration.js';
export declare function toSetupPlugin(pluginName: string): Promise<void>;
export declare function setupCommon(pluginName: string, projectDir: string, pluginConfig: PluginMetadata): Promise<Record<string, any> | false>;
export declare function addScriptsToPackageJson(packageJson: Record<string, any>, provideScripts: Record<string, string>): Promise<Record<string, any>>;
export declare function copyPluginFiles(packagePath: string, projectDir: string, mappings: PluginFileMapping[], payload: Record<string, any>): Promise<void>;
export declare function replaceSafeVariables(command: string, variables: Record<string, string>): string;
//# sourceMappingURL=setup-plugin.d.ts.map