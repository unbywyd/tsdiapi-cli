"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPlugin = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils");
const config_1 = require("../config");
/**
 * Adds a plugin to the current TSDIAPI project.
 *
 * This function operates in two modes:
 *
 * 1. **Direct Installation**:
 *    - If the `pluginName` argument is provided, it checks if the plugin exists
 *      in the list of available plugins (`availablePlugins`).
 *    - If the plugin exists, the installation process begins.
 *    - If the plugin does not exist, an error message is displayed.
 *
 * 2. **Interactive Mode**:
 *    - If `pluginName` is not provided, an interactive prompt is displayed
 *      using `inquirer`.
 *    - The user can select a plugin from the list of available plugins.
 *    - After selection, the installation process begins.
 *
 * The function uses `chalk` for colored console output and `inquirer` for user interaction.
 *
 * @param {string} [pluginName] - The name of the plugin to install. If omitted, the user is prompted to select a plugin.
 * @returns {Promise<void>} - A promise that resolves after the plugin is installed or an error message is displayed.
 */
const addPlugin = async (pluginName) => {
    const currentDirectory = process.cwd();
    if (pluginName) {
        if (config_1.AvailablePlugins.includes(pluginName)) {
            console.log(chalk_1.default.green(`Installing plugin: ${pluginName}...`));
            switch (pluginName) {
                case 'prisma':
                    await (0, utils_1.setupPrisma)(currentDirectory);
                    break;
                case 'socket.io':
                    await (0, utils_1.setupSockets)(currentDirectory);
                    break;
                case 'cron':
                    await (0, utils_1.setupCron)(currentDirectory);
                    break;
                case 'events':
                    await (0, utils_1.setupEvents)(currentDirectory);
                    break;
                case 's3':
                    await (0, utils_1.setupS3)(currentDirectory);
                    break;
                default:
                    console.log(chalk_1.default.red(`No setup logic defined for plugin: ${pluginName}`));
                    return;
            }
            console.log(chalk_1.default.green(`Plugin ${pluginName} successfully installed.`));
        }
        else {
            console.log(chalk_1.default.red(`Plugin ${pluginName} is not available.`));
        }
    }
    else {
        const answer = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedPlugin',
                message: 'Select a plugin to install:',
                choices: config_1.AvailablePlugins,
            },
        ]);
        const selectedPlugin = answer.selectedPlugin;
        console.log(chalk_1.default.green(`Installing plugin: ${selectedPlugin}...`));
        switch (selectedPlugin) {
            case 'prisma':
                await (0, utils_1.setupPrisma)(currentDirectory);
                break;
            case 'socket.io':
                await (0, utils_1.setupSockets)(currentDirectory);
                break;
            case 'cron':
                await (0, utils_1.setupCron)(currentDirectory);
                break;
            case 'events':
                await (0, utils_1.setupEvents)(currentDirectory);
                break;
            case 's3':
                await (0, utils_1.setupS3)(currentDirectory);
                break;
            default:
                console.log(chalk_1.default.red(`No setup logic defined for plugin: ${pluginName}`));
                return;
        }
        console.log(chalk_1.default.green(`Plugin ${selectedPlugin} successfully installed.`));
    }
};
exports.addPlugin = addPlugin;
//# sourceMappingURL=addPlugin.js.map