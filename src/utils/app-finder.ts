import path from "path";
import fs from 'fs'
import { findNearestPackageJson } from "./cwd.js";


/**
 * Finds the root directory of the nearest project containing "@tsdiapi/server" in its dependencies.
 *
 * @returns The root directory path of the TSDIAPI-Server project or null if not found.
 */
export async function findTSDIAPIServerProject(cwd?: string): Promise<string | null> {
    try {
        const packageJsonPath = findNearestPackageJson(cwd);
        if (!packageJsonPath) {
            return null
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.peerDependencies,
            ...packageJson.optionalDependencies,
        }
        if (dependencies && dependencies['@tsdiapi/server']) {
            return path.dirname(packageJsonPath)
        }
        return null;
    } catch (error) {
        console.error('Error while searching for TSDIAPI-Server project:', error.message)
        return null
    }
}