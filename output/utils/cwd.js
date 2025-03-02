"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNearestPackageJson = findNearestPackageJson;
exports.getCdCommand = getCdCommand;
exports.isValidProjectPath = isValidProjectPath;
exports.isPathSuitableToNewProject = isPathSuitableToNewProject;
exports.resolveTargetDirectory = resolveTargetDirectory;
exports.isDirectoryPath = isDirectoryPath;
exports.isValidRequiredPath = isValidRequiredPath;
exports.replacePlaceholdersInPath = replacePlaceholdersInPath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
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
function getCdCommand(targetPath) {
    const cwd = process.cwd();
    const fullPath = path_1.default.resolve(targetPath);
    if (cwd === fullPath) {
        return false;
    }
    const relativePath = path_1.default.relative(cwd, fullPath);
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
function isValidProjectPath(inputPath) {
    const pathPartRegex = /^[a-zA-Z0-9._-]+$/; // Allow dots, underscores, and hyphens.
    try {
        const normalizedPath = path_1.default.normalize(inputPath); // Normalize slashes
        const parts = normalizedPath.split(path_1.default.sep); // Use platform-specific separator
        for (const part of parts) {
            if (part === "" || part.startsWith("..") || !pathPartRegex.test(part)) {
                console.log(chalk_1.default.red(`❌ Error: Invalid directory name "${part}".`));
                return false;
            }
        }
        const resolvedPath = path_1.default.resolve(process.cwd(), normalizedPath);
        if (!resolvedPath.startsWith(process.cwd())) {
            console.log(chalk_1.default.red(`🚨 Error: The project path must be inside the current directory.`));
            return false;
        }
        return true;
    }
    catch (error) {
        console.log(chalk_1.default.red(`❌ Error: Invalid path "${inputPath}".`));
        return false;
    }
}
/**
 * Checks if the given path is suitable for creating a new project.
 * - Ensures the path is valid.
 * - Ensures the directory does not already contain files.
 */
function isPathSuitableToNewProject(pathName) {
    if (!isValidProjectPath(pathName)) {
        console.log(chalk_1.default.red(`🚫 Error: The project path is not valid.`));
        return false;
    }
    const projectDir = path_1.default.resolve(process.cwd(), pathName);
    if (fs_1.default.existsSync(projectDir) && fs_1.default.readdirSync(projectDir).length > 0) {
        console.log(chalk_1.default.red(`❌ Error: Directory "${projectDir}" is not empty.`));
        return false;
    }
    console.log(chalk_1.default.green(`✅ Path is valid and ready for project creation: ${chalk_1.default.bold(projectDir)}`));
    return projectDir;
}
function resolveTargetDirectory(cwd, name) {
    const normalized = path_1.default.normalize(name).replace(/\\/g, "/");
    const lastSlashIndex = normalized.lastIndexOf("/");
    if (lastSlashIndex === -1) {
        return cwd;
    }
    const directory = normalized.substring(0, lastSlashIndex);
    return path_1.default.resolve(cwd, directory);
}
function isDirectoryPath(inputPath) {
    const normalized = path_1.default.normalize(inputPath).replace(/\\/g, "/");
    return path_1.default.extname(normalized) === "";
}
function isValidRequiredPath(requiredPath) {
    // Forbidden glob pattern characters
    const globChars = ["*", "?", "[", "]", "{", "}"];
    // Check if the path is absolute
    if (path_1.default.isAbsolute(requiredPath)) {
        return false;
    }
    // Check if the path contains glob patterns
    if (globChars.some(char => requiredPath.includes(char))) {
        return false;
    }
    // Check if the path goes outside the root (`..`)
    if (requiredPath.includes("..")) {
        return false;
    }
    // Get the file extension
    const ext = path_1.default.extname(requiredPath);
    // The path must contain a file extension
    return ext.length > 1;
}
function replacePlaceholdersInPath(filePath, replacements, defaultName) {
    const dir = path_1.default.dirname(filePath);
    let ext = path_1.default.extname(filePath);
    let fileName = path_1.default.basename(filePath, ext);
    fileName = fileName.replace(/\[([^\]]+)\]/g, (_, key) => replacements[key] || "");
    if (!/[a-zA-Z0-9]/.test(fileName)) {
        fileName = defaultName;
    }
    return path_1.default.join(dir, `${fileName}${ext}`);
}
//# sourceMappingURL=cwd.js.map