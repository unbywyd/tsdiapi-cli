"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNearestPackageJson = findNearestPackageJson;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Finds the nearest package.json file from the given directory up to the root.
 * @param startDir The directory to start searching from (defaults to process.cwd()).
 * @returns The path to package.json or null if not found.
 */
function findNearestPackageJson(startDir = process.cwd()) {
    const root = path_1.default.parse(startDir).root; // System root ("/" on Unix, "C:\" on Windows)
    let currentDir = path_1.default.resolve(startDir);
    do {
        const packageJsonPath = path_1.default.join(currentDir, "package.json");
        if (fs_1.default.existsSync(packageJsonPath)) {
            return packageJsonPath;
        }
        currentDir = path_1.default.dirname(currentDir);
    } while (currentDir !== root); // Stop at the system root
    return null; // No package.json found
}
//# sourceMappingURL=cwd.js.map