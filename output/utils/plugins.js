"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePlugin = exports.updatePlugin = exports.addPlugin = void 0;
exports.getPluginMetaDataFromRoot = getPluginMetaDataFromRoot;
exports.getPluginMetadata = getPluginMetadata;
exports.addPluginToApp = addPluginToApp;
exports.findTSDIAPIServerProject = findTSDIAPIServerProject;
exports.isPackageInstalled = isPackageInstalled;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../config");
const ts_morph_1 = require("ts-morph");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const child_process_1 = require("child_process");
const cwd_1 = require("./cwd");
const setup_plugin_1 = require("./setup-plugin");
const format_1 = require("./format");
const plugins_configuration_1 = require("./plugins-configuration");
const ora_1 = __importDefault(require("ora"));
const npm_1 = require("./npm");
const execAsync = util_1.default.promisify(child_process_1.exec);
const addPlugin = async (selectedPluginName) => {
    try {
        const spinner = (0, ora_1.default)().start();
        spinner.text = chalk_1.default.blue("🔍 Searching for an existing TSDIAPI project...");
        const currentDirectory = await findTSDIAPIServerProject();
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
        spinner.text = chalk_1.default.blue(`📦 Checking if ${packageName} is already installed...`);
        const isInstalled = isPackageInstalled(currentDirectory, packageName);
        if (isInstalled) {
            spinner.warn(chalk_1.default.yellow(`⚠️ Plugin ${packageName} is already installed.`));
            return;
        }
        spinner.text = chalk_1.default.blue(`📥 Installing ${packageName}...`);
        await addPluginToApp(appFilePath, (0, format_1.nameToImportName)(selectedPluginName), packageName, currentDirectory);
        spinner.succeed(chalk_1.default.green(`✅ Successfully added ${packageName} to the application.`));
        spinner.text = chalk_1.default.blue(`🔍 Checking setup configuration for ${packageName}...`);
        const config = await getPluginMetadata(currentDirectory, packageName);
        if (!config) {
            spinner.warn(chalk_1.default.yellow(`⚠️ No additional setup required for ${packageName}.`));
            spinner.succeed(chalk_1.default.green(`✅ Plugin ${packageName} installed successfully.`));
        }
        else {
            if (config.postInstall) {
                spinner.text = chalk_1.default.blue(`⚙️ Running post-install script for ${packageName}...`);
                await (0, npm_1.runPostInstall)(selectedPluginName, currentDirectory, config.postInstall);
                spinner.succeed(chalk_1.default.green(`✅ Post-install script executed.`));
            }
            spinner.text = chalk_1.default.blue(`🔧 Configuring ${packageName}...`);
            await (0, setup_plugin_1.setupCommon)(packageName, currentDirectory, config);
            try {
                if (config.afterInstall) {
                    spinner.text = chalk_1.default.blue(`⚙️ Running after-install script for ${packageName}...`);
                    await (0, npm_1.runPostInstall)(selectedPluginName, currentDirectory, config.afterInstall);
                    spinner.succeed(chalk_1.default.green(`✅ After-install script executed.`));
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
async function addPluginToApp(filePath, pluginName, pluginImportPath, projectDir) {
    const spinner = (0, ora_1.default)().start();
    try {
        spinner.text = chalk_1.default.blue(`📦 Installing ${chalk_1.default.bold(pluginImportPath)}...`);
        await execAsync(`npm install ${pluginImportPath}`, { cwd: projectDir });
        spinner.succeed(chalk_1.default.green(`✅ Installed ${chalk_1.default.bold(pluginImportPath)} successfully!`));
        spinner.text = chalk_1.default.blue("🔍 Updating application entry file...");
        const project = new ts_morph_1.Project();
        const sourceFile = project.addSourceFileAtPath(filePath);
        // Check if import already exists
        const existingImport = sourceFile.getImportDeclaration((imp) => imp.getModuleSpecifier().getLiteralValue() === pluginImportPath);
        if (existingImport) {
            spinner.warn(chalk_1.default.yellow(`⚠️ Plugin ${pluginName} is already imported. Skipping.`));
            return false;
        }
        // Add import statement
        sourceFile.addImportDeclaration({
            defaultImport: pluginName,
            moduleSpecifier: pluginImportPath,
        });
        // Locate `createApp` function
        const createAppCall = sourceFile
            .getFirstDescendantByKind(ts_morph_1.SyntaxKind.CallExpression)
            ?.getFirstChildByKind(ts_morph_1.SyntaxKind.Identifier);
        if (createAppCall?.getText() === "createApp") {
            const createAppExpression = createAppCall.getParentIfKind(ts_morph_1.SyntaxKind.CallExpression);
            const argument = createAppExpression?.getArguments()[0];
            if (argument?.getKind() === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
                const argumentObject = argument.asKindOrThrow(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
                const pluginsProperty = argumentObject.getProperty("plugins");
                if (pluginsProperty) {
                    const pluginsArray = pluginsProperty.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
                    if (pluginsArray) {
                        if (pluginsArray.getText().includes(pluginName)) {
                            spinner.warn(chalk_1.default.yellow(`⚠️ Plugin ${pluginName} is already registered. Skipping.`));
                            return false;
                        }
                        pluginsArray.addElement(`${pluginName}()`);
                    }
                    else {
                        spinner.fail(chalk_1.default.red("❌ Failed to locate 'plugins' array in createApp."));
                        return false;
                    }
                }
                else {
                    argumentObject.addPropertyAssignment({
                        name: "plugins",
                        initializer: `[${pluginName}()]`,
                    });
                }
            }
            else {
                createAppExpression?.addArgument(`{ plugins: [${pluginName}()] }`);
            }
        }
        else {
            spinner.fail(chalk_1.default.red("❌ Failed to find 'createApp' function in main file."));
            return false;
        }
        sourceFile.saveSync();
        spinner.succeed(chalk_1.default.green(`✅ Plugin ${chalk_1.default.bold(pluginName)} successfully added to createApp!`));
        return true;
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`❌ Error: ${error.message}`));
        return false;
    }
}
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
function isPackageInstalled(projectPath, packageName) {
    try {
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
/**
 * Updates an installed plugin in the current TSDIAPI project.
 *
 * @param {string} pluginName - The name of the plugin to update.
 * @returns {Promise<void>} - A promise that resolves after the plugin is updated.
 */
const updatePlugin = async (pluginName) => {
    try {
        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        if (!isPackageInstalled(currentDirectory, pluginName)) {
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
/**
 * Removes a plugin from the current TSDIAPI project.
 *
 * @param {string} pluginName - The name of the plugin to remove.
 * @returns {Promise<void>} - A promise that resolves after the plugin is removed.
 */
const removePlugin = async (pluginName) => {
    try {
        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        if (!isPackageInstalled(currentDirectory, pluginName)) {
            return console.log(chalk_1.default.red(`Plugin ${pluginName} is not installed.`));
        }
        console.log(chalk_1.default.blue(`Removing plugin ${pluginName}...`));
        await execAsync(`npm uninstall ${pluginName}`, { cwd: currentDirectory });
        console.log(chalk_1.default.green(`Plugin ${pluginName} successfully removed.`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error removing plugin ${pluginName}: ${error.message}`));
    }
};
exports.removePlugin = removePlugin;
//# sourceMappingURL=plugins.js.map