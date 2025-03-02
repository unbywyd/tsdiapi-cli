"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginMetaDataFromRoot = getPluginMetaDataFromRoot;
exports.getPluginMetadata = getPluginMetadata;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const plugins_configuration_1 = require("./plugins-configuration");
async function getPluginMetaDataFromRoot(packagePath) {
    const configPath = path_1.default.join(packagePath, 'tsdiapi.config.json');
    if (!fs_1.default.existsSync(configPath)) {
        return null;
    }
    else {
        try {
            const config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
            const isValid = await (0, plugins_configuration_1.validatePluginConfig)(config);
            if (!isValid) {
                return null;
            }
            else {
                return config;
            }
        }
        catch (error) {
            console.error(`Error loading plugin configuration: ${error.message}`);
            return null;
        }
    }
}
async function getPluginMetadata(currentDirectory, packageName) {
    const packagePath = path_1.default.join(currentDirectory, 'node_modules', packageName);
    const configPath = path_1.default.join(packagePath, 'tsdiapi.config.json');
    if (!fs_1.default.existsSync(configPath)) {
        return null;
    }
    else {
        try {
            const config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
            const isValid = await (0, plugins_configuration_1.validatePluginConfig)(config);
            if (!isValid) {
                return null;
            }
            else {
                return config;
            }
        }
        catch (error) {
            console.error(`Error loading plugin configuration: ${error.message}`);
            return null;
        }
    }
}
//# sourceMappingURL=plg-metadata.js.map