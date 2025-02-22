import { Question } from "inquirer";
import { AppParam } from "./app.config";
export interface PluginInquirerOption {
    name: string;
    description?: string;
    validate?: Record<string, any> | string;
    transform?: string;
    when?: string;
    inquirer?: Partial<Question>;
}
export interface PluginGeneratorArg extends PluginInquirerOption {
}
export interface PluginGenerator {
    name: string;
    description?: string;
    files: Array<PluginFileMapping>;
    args?: Array<PluginGeneratorArg>;
}
export interface PluginConfigVariable extends PluginInquirerOption {
    type: AppParam['type'];
    default?: string | number | boolean;
    configurable: boolean;
}
export interface PluginFileMapping {
    source: string;
    destination: string;
    overwrite?: boolean;
    isHandlebarsTemplate?: boolean;
}
export interface PluginMetadata {
    name: string;
    description?: string;
    variables?: Array<PluginConfigVariable>;
    files?: Array<PluginFileMapping>;
    generators?: Array<PluginGenerator>;
    provideScripts?: Record<string, string>;
    postInstall?: string;
    postMessages?: Array<string>;
}
export declare function validatePluginConfig(config: PluginMetadata): boolean;
//# sourceMappingURL=plugins-configuration.d.ts.map