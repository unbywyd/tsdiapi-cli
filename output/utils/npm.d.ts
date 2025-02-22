export declare function runUnsafeNpmScript(projectDir: string, scriptName: string): void;
export declare function runPostInstall(pluginName: string, cwd: string, postInstallCommand: string): Promise<void>;
export declare function runNpmScript(scriptName: string): void;
/**
 * Run `npm install` in the specified directory.
 * @param projectDir The directory where the command should be executed.
 */
export declare function runNpmInstall(projectDir: string): Promise<void>;
export declare function installBaseDependencies(projectDir: string): Promise<void>;
export declare function packageExistsOnNpm(packageName: string, silent?: boolean): Promise<boolean>;
//# sourceMappingURL=npm.d.ts.map