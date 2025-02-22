"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTargetDirectory = resolveTargetDirectory;
exports.isDirectoryPath = isDirectoryPath;
const path_1 = __importDefault(require("path"));
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
//# sourceMappingURL=path-utils.js.map