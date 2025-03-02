"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPackageInstalled = isPackageInstalled;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function isPackageInstalled(projectPath, packageName) {
    try {
        const nodeModulesPath = path_1.default.resolve(projectPath, 'node_modules');
        const pathInNodeModules = path_1.default.resolve(nodeModulesPath, packageName);
        if (fs_1.default.existsSync(pathInNodeModules)) {
            return true;
        }
        const packageJsonPath = path_1.default.resolve(projectPath, 'package.json');
        if (!fs_1.default.existsSync(packageJsonPath)) {
            console.error(`package.json not found in the directory: ${projectPath}`);
            return false;
        }
        const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        const peerDependencies = packageJson.peerDependencies || {};
        return Boolean(dependencies[packageName] ||
            devDependencies[packageName] ||
            peerDependencies[packageName]);
    }
    catch (error) {
        console.error(`Error checking package.json: ${error.message}`);
        return false;
    }
}
//# sourceMappingURL=is-plg-installed.js.map