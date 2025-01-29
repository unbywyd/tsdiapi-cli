import fs from "fs";
import path from "path";

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