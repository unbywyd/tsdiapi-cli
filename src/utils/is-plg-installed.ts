import fs from 'fs'
import path from 'path'

export function isPackageInstalled(projectPath: string, packageName: string): boolean {
    try {
        const nodeModulesPath = path.resolve(projectPath, 'node_modules');
        const pathInNodeModules = path.resolve(nodeModulesPath, packageName);
        if (fs.existsSync(pathInNodeModules)) {
            return true;
        }
        const packageJsonPath = path.resolve(projectPath, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            console.error(`package.json not found in the directory: ${projectPath}`);
            return false;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        const peerDependencies = packageJson.peerDependencies || {};

        return Boolean(
            dependencies[packageName] ||
            devDependencies[packageName] ||
            peerDependencies[packageName]
        );
    } catch (error) {
        console.error(`Error checking package.json: ${error.message}`);
        return false;
    }
}

