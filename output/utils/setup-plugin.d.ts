import { PluginFileMapping, PluginMetadata } from './plugins-configuration';
export declare function toSetupPlugin(pluginName: string): Promise<void>;
export declare function setupCommon(pluginName: string, projectDir: string, pluginConfig: PluginMetadata): Promise<void>;
export declare function addScriptsToPackageJson(packageJson: Record<string, any>, provideScripts: Record<string, string>): Promise<Record<string, any>>;
export declare function copyPluginFiles(packagePath: string, projectDir: string, mappings: PluginFileMapping[]): Promise<void>;
//# sourceMappingURL=setup-plugin.d.ts.map