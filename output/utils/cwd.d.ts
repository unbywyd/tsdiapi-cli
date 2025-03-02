/**
 * Finds the nearest package.json file from the given directory up to the root.
 * @param startDir The directory to start searching from (defaults to process.cwd()).
 * @returns The path to package.json or null if not found.
 */
export declare function findNearestPackageJson(startDir?: string): string | null;
export declare function getCdCommand(targetPath: string): string | false;
/**
 * Checks if a given input path is a valid project path.
 * Ensures that:
 * - The path contains only valid characters.
 * - The path does not start with "..".
 * - The path is inside the current working directory.
 */
export declare function isValidProjectPath(inputPath: string): boolean;
/**
 * Checks if the given path is suitable for creating a new project.
 * - Ensures the path is valid.
 * - Ensures the directory does not already contain files.
 */
export declare function isPathSuitableToNewProject(pathName: string): string | false;
export declare function resolveTargetDirectory(cwd: string, name: string): string;
export declare function isDirectoryPath(inputPath: string): boolean;
export declare function isValidRequiredPath(requiredPath: string): boolean;
export declare function replacePlaceholdersInPath(filePath: string, replacements: Record<string, string>, defaultName: string): string;
//# sourceMappingURL=cwd.d.ts.map