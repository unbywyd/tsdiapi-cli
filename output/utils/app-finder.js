"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTSDIAPIServerProject = findTSDIAPIServerProject;
const path_1 = __importDefault(require("path"));
const cwd_1 = require("./cwd");
const fs_1 = __importDefault(require("fs"));
/**
 * Finds the root directory of the nearest project containing "@tsdiapi/server" in its dependencies.
 *
 * @returns The root directory path of the TSDIAPI-Server project or null if not found.
 */
async function findTSDIAPIServerProject(cwd) {
    try {
        const packageJsonPath = (0, cwd_1.findNearestPackageJson)(cwd);
        if (!packageJsonPath) {
            return null;
        }
        const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.peerDependencies,
            ...packageJson.optionalDependencies,
        };
        if (dependencies && dependencies['@tsdiapi/server']) {
            return path_1.default.dirname(packageJsonPath);
        }
        return null;
    }
    catch (error) {
        console.error('Error while searching for TSDIAPI-Server project:', error.message);
        return null;
    }
}
//# sourceMappingURL=app-finder.js.map