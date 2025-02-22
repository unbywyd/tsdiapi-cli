"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnvVariable = updateEnvVariable;
exports.updateAllEnvFilesWithVariable = updateAllEnvFilesWithVariable;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Updates or adds a key-value pair in the .env file.
 *
 * @param envPath - Path to the .env file.
 * @param key - The key to update or add (e.g., "DATABASE_URL").
 * @param value - The value to set for the key.
 */
function updateEnvVariable(envPath, key, value, onlyIfEmpty = false) {
    const envFilename = path_1.default.basename(envPath);
    try {
        let envContent = '';
        // Check if .env exists, if not create an empty one
        if (fs_extra_1.default.existsSync(envPath)) {
            envContent = fs_extra_1.default.readFileSync(envPath, 'utf8');
        }
        else {
            console.log(chalk_1.default.yellow(`${envFilename} file not found. Creating a new one at ${envPath}.`));
            fs_extra_1.default.writeFileSync(envPath, '');
        }
        // Split the content into lines
        const lines = envContent.split('\n');
        // Update the key-value pair if it exists, or add a new one if it doesn't
        let found = false;
        const updatedLines = lines.map((line) => {
            const [currentKey, ...rest] = line.split('=');
            if (currentKey.trim() === key) {
                found = true;
                // If `onlyIfEmpty` is true, do not overwrite existing non-empty values
                if (onlyIfEmpty && rest.join('=').trim() !== '') {
                    console.log(chalk_1.default.yellow(`${key} already exists in ${envFilename} and will not be updated.`));
                    return line;
                }
                return `${key}="${value}"`; // Replace or update the value
            }
            return line; // Keep the line as is
        });
        if (!found) {
            updatedLines.push(`${key}="${value}"`); // Add the new key-value pair if not found
        }
        // Write the updated content back to the .env file
        fs_extra_1.default.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
        console.log(chalk_1.default.green(`${key} updated in ${envFilename}.`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Failed to update ${key} in ${envFilename}:`), error.message);
    }
}
function updateAllEnvFilesWithVariable(projectDir, key, value, onlyIfEmpty = false) {
    const envPath = path_1.default.join(projectDir, '.env');
    if (fs_extra_1.default.existsSync(envPath)) {
        updateEnvVariable(envPath, key, value, onlyIfEmpty);
    }
    const envExamplePath = path_1.default.join(projectDir, '.env.development');
    if (fs_extra_1.default.existsSync(envExamplePath)) {
        updateEnvVariable(envExamplePath, key, value, onlyIfEmpty);
    }
    const envProductionPath = path_1.default.join(projectDir, '.env.production');
    if (fs_extra_1.default.existsSync(envProductionPath)) {
        updateEnvVariable(envProductionPath, key, value, onlyIfEmpty);
    }
}
//# sourceMappingURL=env.js.map