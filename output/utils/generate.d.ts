import { PluginFileMapping, PluginGenerator } from './plugins-configuration';
export declare function generate(pluginName: string, generatorName?: string, _args?: Record<string, any>): Promise<void>;
export declare function generateFiles(currentGenerator: PluginGenerator, defaultObj: Record<string, any>, currentDirectory: string, plugFiles: PluginFileMapping[]): Promise<void>;
export declare function replacePlaceholdersInPath(filePath: string, replacements: Record<string, string>, defaultName: string): string;
export declare function generateFeature(name: string, projectDir?: string): Promise<void>;
export declare function safeGenerate(pluginName: string, generatorName: string, args?: Record<string, any>): Promise<void>;
export declare function generateNewService(name: string, dir: string): Promise<string | null>;
export declare function generateNewController(name: string, dir: string, withService?: boolean): Promise<string | null>;
//# sourceMappingURL=generate.d.ts.map