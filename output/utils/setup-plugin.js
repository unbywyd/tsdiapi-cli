"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSetupPlugin = toSetupPlugin;
exports.setupCommon = setupCommon;
exports.fileModifications = fileModifications;
exports.addScriptsToPackageJson = addScriptsToPackageJson;
exports.copyPluginFiles = copyPluginFiles;
const config_1 = require("./../config");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const inquirer_2 = require("./inquirer");
const plugins_1 = require("./plugins");
const cwd_1 = require("./cwd");
const env_1 = require("./env");
const app_config_1 = require("./app.config");
function generateInquirerQuestion(variable) {
    return {
        ...variable.inquirer,
        type: variable.inquirer?.type || (variable.type === "boolean" ? "confirm" : "input"),
        name: variable.name,
        message: variable.inquirer?.message || variable.description || variable.name,
        default: variable.inquirer?.default || variable.default || "",
        validate: variable.validate ? (0, inquirer_2.validateInput)(variable.validate) : undefined,
        filter: variable.transform ? (0, inquirer_2.applyTransform)(variable.transform) : undefined,
        when: (0, inquirer_2.convertWhenToFunction)(variable.when)
    };
}
async function toSetupPlugin(pluginName) {
    try {
        const currentDirectory = await (0, plugins_1.findTSDIAPIServerProject)();
        let isLocalPath = false;
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        const packageName = (0, config_1.getPackageName)(pluginName);
        const isInstalled = (0, plugins_1.isPackageInstalled)(currentDirectory, packageName);
        if (!isInstalled) {
            const findByPath = path_1.default.join(process.cwd(), pluginName, 'tsdiapi.config.json');
            const isInstalled = fs_extra_1.default.existsSync(findByPath);
            if (!isInstalled) {
                console.log(chalk_1.default.yellow(`Plugin ${packageName} is not installed. Skipping setup.`));
                return;
            }
            else {
                isLocalPath = true;
            }
        }
        const config = isLocalPath ? await (0, plugins_1.getPluginMetaDataFromRoot)(path_1.default.join(process.cwd(), pluginName)) : await (0, plugins_1.getPluginMetadata)(currentDirectory, packageName);
        if (!config) {
            console.log(chalk_1.default.yellow(`No setup logic defined for plugin: ${packageName}`));
            console.log(chalk_1.default.green(`${packageName} setup has been successfully completed.`));
        }
        else {
            console.log(chalk_1.default.blue(`Loaded configuration for ${packageName}`));
            await setupCommon(packageName, currentDirectory, config);
        }
    }
    catch (e) {
        console.error(chalk_1.default.red(`Error while setting up plugin: ${pluginName}: ${e.message}`));
    }
}
async function setupCommon(pluginName, projectDir, pluginConfig) {
    try {
        const packagePath = path_1.default.resolve(projectDir, 'node_modules', pluginName);
        if (pluginConfig.files && pluginConfig.files.length) {
            await copyPluginFiles(packagePath, projectDir, pluginConfig.files);
        }
        const varNames = pluginConfig.variables?.map((v) => v.name);
        if (!varNames?.length) {
            console.log(chalk_1.default.yellow(`No settings found for ${pluginName}. Skipping setup.`));
        }
        else {
            const { setupCommon } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'setupCommon',
                    message: `Do you want to configure ${pluginName} settings?`,
                    default: true,
                },
            ]);
            if (!setupCommon) {
                console.log(chalk_1.default.yellow(`Setup of ${pluginName} settings has been skipped.`));
            }
            else {
                const vars = pluginConfig.variables || [];
                if (!vars.length) {
                    console.log(chalk_1.default.yellow(`No settings found for ${pluginName}. Skipping setup.`));
                }
                else {
                    const questions = vars
                        .filter((v) => v.inquirer && v.configurable)
                        .map(generateInquirerQuestion);
                    const envAnswers = await inquirer_1.default.prompt(questions);
                    vars.forEach((variable) => {
                        const value = envAnswers[variable.name] ?? variable.default;
                        (0, env_1.updateAllEnvFilesWithVariable)(projectDir, variable.name, value);
                    });
                    console.log(chalk_1.default.green('.env file has been successfully updated with settings.'));
                    const configParams = vars.map((v) => {
                        return { key: v.name, type: v.type };
                    });
                    await (0, app_config_1.addAppConfigParams)(projectDir, configParams);
                }
            }
        }
        if (pluginConfig.provideScripts) {
            try {
                const packageJsonPath = (0, cwd_1.findNearestPackageJson)(projectDir);
                if (packageJsonPath) {
                    const packageJson = JSON.parse(fs_extra_1.default.readFileSync(packageJsonPath, 'utf-8'));
                    const updatedPackageJson = await addScriptsToPackageJson(packageJson, pluginConfig.provideScripts);
                    fs_extra_1.default.writeFileSync(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
                }
            }
            catch (e) {
                console.error(chalk_1.default.red(`Error while adding scripts to package.json: ${e.message}`));
            }
        }
        if (pluginConfig?.postFileModifications?.length) {
            await fileModifications(pluginName, projectDir, pluginConfig.postFileModifications);
        }
        console.log(chalk_1.default.green(`${pluginName} setup has been successfully completed.`));
        if (pluginConfig.postMessages && pluginConfig.postMessages.length) {
            for (const message of pluginConfig.postMessages) {
                console.log(chalk_1.default.green(`- ${message}`));
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error while setting up ${pluginName} settings: ${error.message}`));
    }
}
async function fileModifications(pluginName, projectDir, modifications) {
    try {
        const pendingChanges = [];
        for (const mod of modifications) {
            const filePath = path_1.default.join(projectDir, mod.path);
            if (!fs_extra_1.default.existsSync(filePath)) {
                console.log(chalk_1.default.yellow(`⚠️ Skipping ${filePath} (File not found)`));
                continue;
            }
            const fileContent = await fs_extra_1.default.readFile(filePath, "utf8");
            const regex = new RegExp(mod.match, "g");
            const matchFound = regex.test(fileContent);
            if (mod.expected !== undefined && matchFound !== mod.expected) {
                console.log(chalk_1.default.yellow(`⚠️ Skipping modification for ${filePath} (Expected match condition not met)`));
                continue;
            }
            pendingChanges.push({
                filePath,
                mode: mod.mode,
                plugin: pluginName
            });
        }
        if (pendingChanges.length === 0) {
            console.log(chalk_1.default.blue(`✅ No modifications required for ${pluginName}.`));
            return;
        }
        console.log(chalk_1.default.blue(`⚡ Plugin "${pluginName}" wants to modify ${pendingChanges.length} files:`));
        for (const { filePath, mode } of pendingChanges) {
            console.log(`- ${filePath} (${mode})`);
        }
        for (const mod of modifications) {
            const filePath = path_1.default.join(projectDir, mod.path);
            if (!fs_extra_1.default.existsSync(filePath))
                continue;
            let fileContent = await fs_extra_1.default.readFile(filePath, "utf8");
            if (mod.mode === "prepend") {
                fileContent = mod.content + "\n" + fileContent;
            }
            else if (mod.mode === "append") {
                fileContent = fileContent + "\n" + mod.content;
            }
            await fs_extra_1.default.writeFile(filePath, fileContent, "utf8");
            console.log(chalk_1.default.green(`✅ Updated: ${filePath} (${mod.mode})`));
        }
        console.log(chalk_1.default.blue(`🎉 Modifications applied successfully for "${pluginName}"`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`❌ Error while modifying files: ${error.message}`));
    }
}
async function addScriptsToPackageJson(packageJson, provideScripts) {
    if (!packageJson.scripts) {
        packageJson.scripts = {};
    }
    const toAddScripts = [];
    for (const [scriptName, command] of Object.entries(provideScripts)) {
        if (!packageJson.scripts[scriptName]) {
            toAddScripts.push({ scriptName, command });
        }
        else {
            console.log(chalk_1.default.yellow(`⚠️ Script "${scriptName}" already exists in the package.json.`));
        }
    }
    if (toAddScripts.length) {
        console.log(chalk_1.default.yellow('The following scripts will be added to your package.json:'));
        for (const { scriptName, command } of toAddScripts) {
            console.log(`${chalk_1.default.green('🟡 (new)')} ${chalk_1.default.white(scriptName)}: ${chalk_1.default.white(command)}`);
        }
        console.log('\n');
        const { accepted } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'accepted',
                message: `Do you want to add these scripts to your package.json?`,
                default: true,
            },
        ]);
        if (!accepted) {
            console.log(chalk_1.default.yellow('❌ Scripts were not added to the package.json.'));
            return packageJson;
        }
        for (const { scriptName, command } of toAddScripts) {
            packageJson.scripts[scriptName] = command;
            console.log(chalk_1.default.green(`✅ Script "${scriptName}" has been added to the package.json.`));
        }
    }
    return packageJson;
}
async function copyPluginFiles(packagePath, projectDir, mappings) {
    try {
        const filesToCopy = [];
        for (const { source, destination, overwrite = false } of mappings) {
            const resolvedDest = path_1.default.resolve(projectDir, destination);
            const files = glob_1.glob.sync(source, { cwd: packagePath });
            if (files.length === 0) {
                continue;
            }
            for (const file of files) {
                const sourceFile = path_1.default.resolve(packagePath, file);
                const fileName = path_1.default.basename(file);
                const targetPath = (0, cwd_1.isDirectoryPath)(resolvedDest) ? path_1.default.join(resolvedDest, fileName) : resolvedDest;
                const isExisting = fs_extra_1.default.existsSync(targetPath);
                if (!overwrite && isExisting) {
                    console.log(`⚠️ Skipping: File already exists: ${targetPath}`);
                    continue;
                }
                filesToCopy.push({ sourceFile, targetPath, overwrite, isExisting });
            }
        }
        if (filesToCopy.length) {
            console.log(chalk_1.default.yellow('The following files will be added/updated in your project:'));
            for (const { targetPath, isExisting } of filesToCopy) {
                if (isExisting) {
                    console.log(`${chalk_1.default.yellow('⚠️ (replace)')} ${chalk_1.default.white(targetPath)}`);
                }
                else {
                    console.log(`${chalk_1.default.green('🟡 (new)')} ${chalk_1.default.white(targetPath)}`);
                }
            }
            console.log('\n');
            const { accepted } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'accepted',
                    message: `Do you want to add these files to your project?`,
                    default: true,
                },
            ]);
            if (!accepted) {
                console.log(chalk_1.default.yellow('❌ Files were not added to the project.'));
                return;
            }
            for (const { sourceFile, targetPath, overwrite } of filesToCopy) {
                fs_extra_1.default.ensureDirSync(path_1.default.dirname(targetPath));
                fs_extra_1.default.copySync(sourceFile, targetPath, { overwrite });
                console.log(chalk_1.default.green(`✅ File "${targetPath}" has been added to the project.`));
            }
        }
    }
    catch (error) {
        console.error(`❌ Error copying plugin files: ${error.message}`);
    }
}
//# sourceMappingURL=setup-plugin.js.map