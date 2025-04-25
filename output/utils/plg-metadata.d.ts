import { PluginMetadata } from './plugins-configuration.js';
export declare function getPluginMetaDataFromRoot(packagePath: string): Promise<any>;
export declare function getPluginMetadata(currentDirectory: string, packageName: string): Promise<PluginMetadata | null>;
export declare function getPluginMetaDataFromPath(packagePath: string): Promise<PluginMetadata | null>;
//# sourceMappingURL=plg-metadata.d.ts.map