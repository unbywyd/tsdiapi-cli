import { PluginFileMapping, PluginGenerator } from '../utils/plugins-configuration.js';
export declare function generate(pluginName: string, fileName: string, generatorName?: string, toFeature?: string): Promise<void>;
export declare function generateFiles(currentGenerator: PluginGenerator, defaultObj: Record<string, any>, currentDirectory: string, plugFiles: PluginFileMapping[]): Promise<void>;
export declare function generateFeature(name: string, projectDir?: string): Promise<void>;
export declare function safeGenerate(pluginName: string, output: string, args?: Record<string, any>, fName?: string): Promise<void>;
export declare function generateNewService(name: string, dir: string): Promise<string | null>;
export declare function generateNewController(name: string, dir: string, withService?: boolean): Promise<string | null>;
//# sourceMappingURL=generate.d.ts.map