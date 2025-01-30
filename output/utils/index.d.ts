import { CliOptions } from '..';
/**
 * Builds a Handlebars template by loading the template file and compiling it with the provided data.
 *
 * @param templateName - The name of the template file (without the .hbs extension).
 * @param data - The data object to populate the template.
 * @returns The compiled template as a string.
 */
export declare function buildHandlebarsTemplate(templateName: string, data: any): string;
/**
 * Run `npm install` in the specified directory.
 * @param projectDir The directory where the command should be executed.
 */
export declare function runNpmInstall(projectDir: string): Promise<void>;
export declare function setupPrisma(projectDir: string): Promise<void>;
/**
 * Updates or adds a key-value pair in the .env file.
 *
 * @param envPath - Path to the .env file.
 * @param key - The key to update or add (e.g., "DATABASE_URL").
 * @param value - The value to set for the key.
 */
export declare function updateEnvVariable(envPath: string, key: string, value: string): void;
export declare function updateAllEnvFilesWithVariable(projectDir: string, key: string, value: string): void;
export declare function setupSockets(projectDir: string, options?: CliOptions): Promise<void>;
export declare function setupCron(projectDir: string): void;
export declare function setupEvents(projectDir: string): void;
export type AppParam = {
    key: string;
    type: 'string' | 'number' | 'boolean';
};
export declare function setupJWTAuth(projectDir: string): Promise<void>;
export declare function setupEmail(projectDir: string): Promise<void>;
export declare function addEmailAppParams(projectDir: string): Promise<void>;
export declare function configEmail(projectDir: string): Promise<void>;
export declare function setupInforu(projectDir: string): Promise<void>;
export declare function configInforu(projectDir: string): Promise<void>;
export declare function addInforuAppParams(projectDir: string): Promise<void>;
export declare function addJWTAppParams(projectDir: string): Promise<void>;
export declare function setupS3(projectDir: string): Promise<void>;
export declare function addS3AppParams(projectDir: string): Promise<void>;
export declare function addAppConfigParams(projectDir: string, params: AppParam[]): Promise<void>;
export declare function runNpmScript(scriptName: string): void;
//# sourceMappingURL=index.d.ts.map