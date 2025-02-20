"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePlugin = exports.updatePlugin = exports.addPlugin = void 0;
exports.findTSDIAPIServerProject = findTSDIAPIServerProject;
exports.isPackageInstalled = isPackageInstalled;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const _1 = require(".");
const config_1 = require("../config");
const ts_morph_1 = require("ts-morph");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const child_process_1 = require("child_process");
const cwd_1 = require("./cwd");
const setup_plugin_1 = require("./setup-plugin");
const format_1 = require("./format");
const execAsync = util_1.default.promisify(child_process_1.exec);
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
    try {
        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        let selectedPluginName = pluginName;
        const appFilePath = path_1.default.resolve(`${currentDirectory}/src`, 'main.ts');
        const isPackageName = pluginName && pluginName?.startsWith('@tsdiapi/');
        if (pluginName && !config_1.AvailablePlugins.includes(pluginName) && !isPackageName) {
            return console.log(chalk_1.default.red(`Plugin ${pluginName} is not available.`));
        }
        if (!pluginName) {
            const answer = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'selectedPlugin',
                    message: 'Select a plugin to install:',
                    choices: config_1.AvailablePlugins,
                },
            ]);
            selectedPluginName = answer.selectedPlugin;
        }
        const packageName = isPackageName ? pluginName : (0, config_1.getPackageName)(selectedPluginName);
        const isInstalled = isPackageInstalled(currentDirectory, packageName);
        if (isInstalled) {
            return console.log(chalk_1.default.red(`Plugin ${packageName} already installed!`));
        }
        await addPluginToApp(appFilePath, (0, format_1.nameToImportName)(selectedPluginName), packageName, currentDirectory);
        try {
            switch (selectedPluginName) {
                case 'prisma':
                    await (0, _1.setupPrisma)(currentDirectory);
                    break;
                case 'socket.io':
                    await (0, _1.setupSockets)(currentDirectory);
                    break;
                case 'cron':
                    await (0, _1.setupCron)(currentDirectory);
                    break;
                case 'events':
                    await (0, _1.setupEvents)(currentDirectory);
                    break;
                /*case 's3':
                  await setupS3(currentDirectory);
                  break*/
                /*case 'jwt-auth':
                  await setupJWTAuth(currentDirectory);
                  break*/
                /*case 'inforu':
                  await setupInforu(currentDirectory);
                  break*/
                /*case 'email':
                  await setupEmail(currentDirectory);
                  break*/
                default:
                    const packagePath = path_1.default.join(currentDirectory, 'node_modules', packageName);
                    const configPath = path_1.default.join(packagePath, 'tsdiapi.config.json');
                    if (!fs_1.default.existsSync(configPath)) {
                        console.log(chalk_1.default.yellow(`No setup logic defined for plugin: ${pluginName}`));
                        console.log(chalk_1.default.green(`${pluginName} setup has been successfully completed.`));
                        return;
                    }
                    else {
                        try {
                            const pluginConfig = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
                            console.log(chalk_1.default.blue(`Loaded configuration for ${pluginConfig.name}`));
                            await (0, setup_plugin_1.setupCommon)(pluginName, currentDirectory, pluginConfig);
                        }
                        catch (error) {
                            console.error(`Error loading plugin configuration: ${error.message}`);
                        }
                    }
                    return;
            }
        }
        catch (error) {
            console.error(`Error adding plugin ${selectedPluginName}: ${error.message}`);
        }
        console.log(chalk_1.default.green(`Plugin ${selectedPluginName} successfully installed.`));
    }
    catch (e) {
        console.error(chalk_1.default.red("An unexpected error occurred: ", e.message));
        process.exit(1);
    }
};
exports.addPlugin = addPlugin;
async function addPluginToApp(filePath, pluginName, pluginImportPath, projectDir) {
    const project = new ts_morph_1.Project();
    const sourceFile = project.addSourceFileAtPath(filePath);
    if (!config_1.IsDev) {
        console.log(chalk_1.default.blue(`Installing ${pluginImportPath}...`));
        await execAsync(`npm install ${pluginImportPath}`, {
            cwd: projectDir,
        });
    }
    else {
        console.log(chalk_1.default.yellow(`Skipping npm install in dev mode.`));
    }
    const existingImport = sourceFile.getImportDeclaration((imp) => imp.getModuleSpecifier().getLiteralValue() === pluginImportPath);
    if (existingImport) {
        return false;
    }
    sourceFile.addImportDeclaration({
        defaultImport: pluginName,
        moduleSpecifier: pluginImportPath,
    });
    const createAppCall = sourceFile
        .getFirstDescendantByKind(ts_morph_1.SyntaxKind.CallExpression)
        ?.getFirstChildByKind(ts_morph_1.SyntaxKind.Identifier);
    if (createAppCall?.getText() === 'createApp') {
        const createAppExpression = createAppCall.getParentIfKind(ts_morph_1.SyntaxKind.CallExpression);
        const argument = createAppExpression?.getArguments()[0];
        if (argument?.getKind() === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
            const argumentObject = argument.asKindOrThrow(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
            const pluginsProperty = argumentObject.getProperty('plugins');
            if (pluginsProperty) {
                const pluginsArray = pluginsProperty.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
                if (pluginsArray) {
                    const pluginAlreadyAdded = pluginsArray.getText().includes(pluginName);
                    if (pluginAlreadyAdded) {
                        console.log(chalk_1.default.yellow(`Plugin ${pluginName} already added to the app.`));
                        return false;
                    }
                    pluginsArray.addElement(`${pluginName}()`);
                }
                else {
                    console.log(chalk_1.default.red('Error adding plugin to app.'));
                }
            }
            else {
                argumentObject.addPropertyAssignment({
                    name: 'plugins',
                    initializer: `[${pluginName}()]`,
                });
            }
        }
        else {
            createAppExpression?.addArgument(`{ plugins: [${pluginName}()] }`);
        }
    }
    else {
        console.error('createApp function not found.');
        return false;
    }
    try {
        sourceFile.saveSync();
    }
    catch (error) {
        console.error('Error saving source file:', error.message);
        return false;
    }
    return true;
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