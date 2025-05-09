import { Question } from "inquirer";
import { AppParam } from "./app.config.js";
export interface CommandWithCondition {
    when?: string;
    command: string;
}
export interface PluginInquirerOption {
    name: string;
    alias?: string;
    description?: string;
    validate?: Record<string, any> | string;
    transform?: string;
    when?: string;
    inquirer?: Partial<Question>;
}
export interface PluginConfigVariable extends PluginInquirerOption {
    type: AppParam['type'];
    default?: string | number | boolean;
    configurable: boolean;
    skipEnvSave?: boolean;
}
export interface PluginGeneratorArg extends PluginInquirerOption {
    saveEnv?: boolean;
    type?: AppParam['type'];
}
export interface PrismaScript {
    description: string;
    command: string;
    when?: string;
}
export interface PluginGenerator {
    name: string;
    description?: string;
    files: Array<PluginFileMapping>;
    args?: Array<PluginGeneratorArg>;
    fileModifications?: Array<PluginFileModification>;
    postMessages?: Array<string>;
    preMessages?: Array<string>;
    afterGenerate?: CommandWithCondition;
    requiredPackages?: Array<string>;
    dependencies?: Array<string>;
    requiredPaths?: Array<string>;
    prismaScripts?: PrismaScript[];
}
export interface PluginRegistration {
    pluginImportName: string;
    pluginArgs?: string;
    imports?: string[];
}
export interface PluginFileMapping {
    source: string;
    destination: string;
    overwrite?: boolean;
    isHandlebarsTemplate?: boolean;
    isRoot?: boolean;
}
export interface PluginFileModification {
    path: string;
    mode: "prepend" | "append";
    content: string;
    match: string;
    expected?: boolean;
    isHandlebarsTemplate?: boolean;
    when?: string;
}
export interface PluginMetadata {
    name: string;
    description?: string;
    registration?: PluginRegistration;
    variables?: Array<PluginConfigVariable>;
    files?: Array<PluginFileMapping>;
    generators?: Array<PluginGenerator>;
    provideScripts?: Record<string, string>;
    postInstall?: string;
    afterInstall?: CommandWithCondition;
    postMessages?: Array<string>;
    preMessages?: Array<string>;
    postFileModifications?: Array<PluginFileModification>;
    requiredPackages?: Array<string>;
    requiredPaths?: Array<string>;
    prisma?: {
        required: boolean;
        scripts?: Array<PrismaScript>;
    };
}
export declare function validatePluginConfig(config: PluginMetadata): boolean;
//# sourceMappingURL=plugins-configuration.d.ts.map