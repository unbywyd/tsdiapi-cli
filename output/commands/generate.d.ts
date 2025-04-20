import { PluginFileMapping, PluginGenerator } from '../utils/plugins-configuration.js';
export declare function generate(pluginName: string, fileName: string, generatorName?: string, toFeature?: string): Promise<void>;
export declare function generateFiles(currentGenerator: PluginGenerator, defaultObj: Record<string, any>, currentDirectory: string, plugFiles: PluginFileMapping[]): Promise<void>;
export declare function generateFeature(name: string, projectDir?: string, getstarted?: boolean): Promise<void>;
export declare function safeGenerate(pluginName: string, output: string, fName?: string): Promise<void>;
export declare function generateNewService(name: string, dir: string, getstarted?: boolean): Promise<{
    className: string;
    path: string;
    filename: string;
} | null>;
export declare function generateNewModule(name: string, dir: string, service?: {
    className: string;
    path: string;
    filename: string;
}, getstarted?: boolean): Promise<{
    className: string;
    path: string;
    filename: string;
} | null>;
//# sourceMappingURL=generate.d.ts.map