import fs from "fs";
import path from "path";
import chalk from 'chalk';

/**
 * Finds the nearest package.json file from the given directory up to the root.
 * @param startDir The directory to start searching from (defaults to process.cwd()).
 * @returns The path to package.json or null if not found.
 */
export function findNearestPackageJson(startDir: string = process.cwd()): string | null {
    const root = path.parse(startDir).root; // System root ("/" on Unix, "C:\" on Windows)
    let currentDir = path.resolve(startDir);

    do {
        const packageJsonPath = path.join(currentDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            return packageJsonPath;
        }

        currentDir = path.dirname(currentDir);
    } while (currentDir !== root); // Stop at the system root

    return null; // No package.json found
}

export function getCdCommand(targetPath: string): string | false {
    const cwd = process.cwd();
    const fullPath = path.resolve(targetPath);
    if (cwd === fullPath) {
        return false;
    }
    
    const relativePath = path.relative(cwd, fullPath);

    if (relativePath.startsWith('..')) {
        return false;
    }
    return `cd ${relativePath}`;
}

/**
 * Checks if a given input path is a valid project path.
 * Ensures that:
 * - The path contains only valid characters.
 * - The path does not start with "..".
 * - The path is inside the current working directory.
 */
export function isValidProjectPath(inputPath: string): boolean {
    const pathPartRegex = /^[a-zA-Z0-9._-]+$/; // Allow dots, underscores, and hyphens.

    try {
        const normalizedPath = path.normalize(inputPath); // Normalize slashes
        const parts = normalizedPath.split(path.sep); // Use platform-specific separator

        for (const part of parts) {
            if (part === "" || part.startsWith("..") || !pathPartRegex.test(part)) {
                console.log(chalk.red(`❌ Error: Invalid directory name "${part}".`));
                return false;
            }
        }

        const resolvedPath = path.resolve(process.cwd(), normalizedPath);
        if (!resolvedPath.startsWith(process.cwd())) {
            console.log(chalk.red(`🚨 Error: The project path must be inside the current directory.`));
            return false;
        }

        return true;
    } catch (error) {
        console.log(chalk.red(`❌ Error: Invalid path "${inputPath}".`));
        return false;
    }
}

/**
 * Checks if the given path is suitable for creating a new project.
 * - Ensures the path is valid.
 * - Ensures the directory does not already contain files.
 */
export function isPathSuitableToNewProject(pathName: string): string | false {
    if (!isValidProjectPath(pathName)) {
        console.log(chalk.red(`🚫 Error: The project path is not valid.`));
        return false;
    }

    const projectDir = path.resolve(process.cwd(), pathName);

    if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0) {
        console.log(chalk.red(`❌ Error: Directory "${projectDir}" is not empty.`));
        return false;
    }

    console.log(chalk.green(`✅ Path is valid and ready for project creation: ${chalk.bold(projectDir)}`));
    return projectDir;
}

export function resolveTargetDirectory(cwd: string, name: string): string {
    const normalized = path.normalize(name).replace(/\\/g, "/");

    const lastSlashIndex = normalized.lastIndexOf("/");

    if (lastSlashIndex === -1) {
        return cwd;
    }

    const directory = normalized.substring(0, lastSlashIndex);

    return path.resolve(cwd, directory);
}


export function isDirectoryPath(inputPath: string): boolean {
    const normalized = path.normalize(inputPath).replace(/\\/g, "/");

    return path.extname(normalized) === "";
}
