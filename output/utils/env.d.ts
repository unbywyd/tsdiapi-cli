/**
 * Updates or adds a key-value pair in the .env file.
 *
 * @param envPath - Path to the .env file.
 * @param key - The key to update or add (e.g., "DATABASE_URL").
 * @param value - The value to set for the key.
 */
export declare function updateEnvVariable(envPath: string, key: string, value: string, onlyIfEmpty?: boolean): void;
export declare function updateAllEnvFilesWithVariable(projectDir: string, key: string, value: string, onlyIfEmpty?: boolean): void;
//# sourceMappingURL=env.d.ts.map