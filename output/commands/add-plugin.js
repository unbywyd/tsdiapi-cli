"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPlugin = void 0;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../config");
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const npm_1 = require("../utils/npm");
const format_1 = require("../utils/format");
const setup_plugin_1 = require("../utils/setup-plugin");
const inquirer_1 = require("../utils/inquirer");
const app_finder_1 = require("../utils/app-finder");
const is_plg_installed_1 = require("../utils/is-plg-installed");
const app_plg_to_app_1 = require("../utils/app-plg-to-app");
const plg_metadata_1 = require("../utils/plg-metadata");
const addPlugin = async (selectedPluginName) => {
    try {
        const spinner = (0, ora_1.default)().start();
        spinner.text = chalk_1.default.blue("🔍 Searching for an existing TSDIAPI project...");
        const currentDirectory = await (0, app_finder_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            spinner.fail(chalk_1.default.red("❌ No package.json found or @tsdiapi/server is not detected."));
            return;
        }
        const appFilePath = path_1.default.resolve(`${currentDirectory}/src`, "main.ts");
        const packageName = (0, config_1.getPackageName)(selectedPluginName);
        if (!packageName?.startsWith("@tsdiapi/")) {
            spinner.fail(chalk_1.default.red(`❌ Invalid plugin: ${packageName}. Must start with @tsdiapi/`));
            return;
        }
        spinner.text = chalk_1.default.blue(`🔎 Checking if ${packageName} exists on npm...`);
        const packageExists = await (0, npm_1.packageExistsOnNpm)(packageName);
        if (!packageExists) {
            spinner.fail(chalk_1.default.red(`❌ Package ${packageName} does not exist on npm.`));
            return;
        }
        const isInstalled = (0, is_plg_installed_1.isPackageInstalled)(currentDirectory, packageName);
        if (!isInstalled) {
            spinner.text = chalk_1.default.blue(`📥 Installing ${packageName}...`);
            await (0, app_plg_to_app_1.addPluginToApp)(appFilePath, (0, format_1.nameToImportName)(selectedPluginName), packageName, currentDirectory);
            spinner.succeed(chalk_1.default.green(`✅ Successfully added ${packageName} to the application.`));
        }
        spinner.text = chalk_1.default.blue(`🔍 Checking setup configuration for ${packageName}...`);
        const config = await (0, plg_metadata_1.getPluginMetadata)(currentDirectory, packageName);
        if (isInstalled) {
            if (!config) {
                spinner.warn(chalk_1.default.yellow(`⚠️ Plugin ${packageName} is already installed.`));
                return;
            }
        }
        if (!config) {
            spinner.warn(chalk_1.default.yellow(`⚠️ No additional setup required for ${packageName}.`));
            spinner.succeed(chalk_1.default.green(`✅ Plugin ${packageName} installed successfully.`));
        }
        else {
            if (config.postInstall) {
                spinner.text = chalk_1.default.blue(`⚙️ Running post-install script for ${packageName}...`);
                console.log(chalk_1.default.blue(`⚙️ Running post-install script for ${packageName}...`));
                await (0, npm_1.runPostInstall)(selectedPluginName, currentDirectory, config.postInstall);
                spinner.succeed(chalk_1.default.green(`✅ Post-install script executed.`));
            }
            spinner.text = chalk_1.default.blue(`🔧 Configuring ${packageName}...`);
            spinner.stop();
            const result = await (0, setup_plugin_1.setupCommon)(packageName, currentDirectory, config);
            if (!result) {
                spinner.fail(chalk_1.default.red(`❌ Plugin not configured correctly. Please check the logs for more information.`));
                return;
            }
            try {
                if (config.afterInstall && result) {
                    const cond = config.afterInstall?.when ? (0, inquirer_1.convertWhenToFunction)(config.afterInstall.when)(result) : true;
                    if (cond) {
                        console.log(chalk_1.default.blue(`⚙️ Running after-install script for ${packageName}...`));
                        await (0, npm_1.runPostInstall)(selectedPluginName, currentDirectory, config.afterInstall?.command);
                        spinner.succeed(chalk_1.default.green(`✅ After-install script executed.`));
                    }
                }
            }
            catch (error) {
                spinner.fail(chalk_1.default.red(`❌ Error running after-setup script: ${error.message}`));
            }
            spinner.succeed(chalk_1.default.green(`✅ Configuration for ${packageName} completed.`));
        }
        console.log(chalk_1.default.green(`\n🎉 Plugin ${chalk_1.default.bold(selectedPluginName)} installed successfully! 🚀\n`));
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ An unexpected error occurred: "), error.message);
        process.exit(1);
    }
};
exports.addPlugin = addPlugin;
//# sourceMappingURL=add-plugin.js.map