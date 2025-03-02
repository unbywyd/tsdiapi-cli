"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlugin = void 0;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../config");
const util_1 = __importDefault(require("util"));
const child_process_1 = require("child_process");
const app_finder_1 = require("../utils/app-finder");
const is_plg_installed_1 = require("../utils/is-plg-installed");
const execAsync = util_1.default.promisify(child_process_1.exec);
/**
 * Updates an installed plugin in the current TSDIAPI project.
 *
 * @param {string} pluginName - The name of the plugin to update.
 * @returns {Promise<void>} - A promise that resolves after the plugin is updated.
 */
const updatePlugin = async (sourceName) => {
    const pluginName = (0, config_1.getPackageName)(sourceName);
    try {
        const currentDirectory = await (0, app_finder_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        if (!(0, is_plg_installed_1.isPackageInstalled)(currentDirectory, pluginName)) {
            return console.log(chalk_1.default.red(`Plugin ${pluginName} is not installed.`));
        }
        console.log(chalk_1.default.blue(`Updating plugin ${pluginName}...`));
        await execAsync(`npm update ${pluginName}`, { cwd: currentDirectory });
        console.log(chalk_1.default.green(`Plugin ${pluginName} successfully updated.`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error updating plugin ${pluginName}: ${error.message}`));
    }
};
exports.updatePlugin = updatePlugin;
//# sourceMappingURL=update-plg.js.map