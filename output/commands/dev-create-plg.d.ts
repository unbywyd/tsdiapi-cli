import { CommandWithCondition, PluginConfigVariable, PluginFileMapping, PrismaScript } from '../utils/plugins-configuration.js';
export declare function promptPluginDetails(sourcePluginName: string): Promise<void>;
export declare function installDependencies(projectDir: string): Promise<void>;
export declare function promptMessages(pluginName: string, prompt: string): Promise<string[]>;
export declare function promptAfterInstall(pluginName: string): Promise<CommandWithCondition | null>;
export declare function promptRequiredPackages(): Promise<string[]>;
export declare function promptRequiredPaths(): Promise<string[]>;
export declare function promptPostInstall(pluginName: string): Promise<string | null>;
export declare function promptProvideScripts(pluginName: string): Promise<Record<string, string> | null>;
export declare function promptPluginVariables(pluginName: string): Promise<PluginConfigVariable[]>;
export declare function promptFiles(pluginName: string): Promise<Array<PluginFileMapping>>;
export declare function promptPrismaDependency(pluginName: string): Promise<{
    required: boolean;
    scripts?: Array<PrismaScript>;
} | null>;
//# sourceMappingURL=dev-create-plg.d.ts.map