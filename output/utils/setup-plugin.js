"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSetupPlugin = toSetupPlugin;
exports.setupCommon = setupCommon;
exports.addScriptsToPackageJson = addScriptsToPackageJson;
exports.copyPluginFiles = copyPluginFiles;
const config_1 = require("./../config");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const inquirer_2 = require("./inquirer");
const cwd_1 = require("./cwd");
const env_1 = require("./env");
const app_config_1 = require("./app.config");
const modifications_1 = require("./modifications");
const format_1 = require("./format");
const handlebars_1 = __importDefault(require("./handlebars"));
const app_finder_1 = require("./app-finder");
const is_plg_installed_1 = require("./is-plg-installed");
const plg_metadata_1 = require("./plg-metadata");
async function loadBoxen() {
    return (await eval('import("boxen")')).default;
}
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
        const currentDirectory = await (0, app_finder_1.findTSDIAPIServerProject)();
        let isLocalPath = false;
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        const packageName = (0, config_1.getPackageName)(pluginName);
        const isInstalled = (0, is_plg_installed_1.isPackageInstalled)(currentDirectory, packageName);
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
        const config = isLocalPath ? await (0, plg_metadata_1.getPluginMetaDataFromRoot)(path_1.default.join(process.cwd(), pluginName)) : await (0, plg_metadata_1.getPluginMetadata)(currentDirectory, packageName);
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
        const packagesFailHints = [];
        const packagesSuccessHints = [];
        const pathFailHints = [];
        const pathSuccessHints = [];
        const beforeMessages = [];
        if (pluginConfig?.preMessages?.length) {
            for (const message of pluginConfig.preMessages) {
                try {
                    const template = handlebars_1.default.compile(message);
                    beforeMessages.push(chalk_1.default.cyan(`- ${template({ pluginName, name: pluginName })}`));
                }
                catch (e) {
                    console.error(chalk_1.default.red(`Error while rendering pre message: ${e.message}`));
                }
            }
        }
        if (pluginConfig.requiredPackages?.length) {
            console.log(chalk_1.default.blue(`Checking required packages for plugin ${pluginName}...`));
            for (const packageName of pluginConfig.requiredPackages) {
                const isInstalled = await (0, is_plg_installed_1.isPackageInstalled)(projectDir, packageName);
                if (!isInstalled) {
                    if (packageName.startsWith('@tsdiapi')) {
                        packagesFailHints.push(`${chalk_1.default.red('✘')} ${packageName} - Install with: ${chalk_1.default.cyan(`tsdiapi plugins add ${packageName}`)}`);
                    }
                    else {
                        packagesFailHints.push(`${chalk_1.default.red('✘')} ${packageName} - Install with: ${chalk_1.default.cyan(`npm install ${packageName}`)}`);
                    }
                }
                else {
                    packagesSuccessHints.push(`${chalk_1.default.green('✔')} ${packageName} - Already installed`);
                }
            }
        }
        if (pluginConfig?.requiredPaths?.length) {
            console.log(chalk_1.default.blue(`Checking required paths for plugin ${pluginName}...`));
            for (const requiredPath of pluginConfig.requiredPaths) {
                const fullPath = path_1.default.join(projectDir, requiredPath);
                if (!fs_extra_1.default.existsSync(fullPath)) {
                    pathFailHints.push(`${chalk_1.default.red('✘')} ${requiredPath} - File or directory not found`);
                }
                else {
                    pathSuccessHints.push(`${chalk_1.default.green('✔')} ${requiredPath} - Found`);
                }
            }
        }
        const boxen = await loadBoxen();
        if (packagesFailHints.length || pathFailHints.length || packagesSuccessHints.length || pathSuccessHints.length || beforeMessages.length) {
            let sections = [];
            if (beforeMessages.length) {
                sections.push(`${chalk_1.default.bold.cyan('Pre-Setup Messages:')}
${beforeMessages.join('\n')}`);
            }
            if (packagesSuccessHints.length || pathSuccessHints.length) {
                sections.push(`${chalk_1.default.bold.green('✅ Already Installed:')}
${[...packagesSuccessHints, ...pathSuccessHints].join('\n')}`);
            }
            if (packagesFailHints.length || pathFailHints.length) {
                sections.push(`${chalk_1.default.bold.red('❌ Missing Dependencies:')}
${[...packagesFailHints, ...pathFailHints].join('\n')}`);
            }
            const message = sections.join('\n\n') + '\n' + chalk_1.default.yellow('Ensure all required dependencies are met before installation.');
            console.log(boxen(message, {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'yellow'
            }));
        }
        if (packagesFailHints.length || pathFailHints.length) {
            console.log(chalk_1.default.red(`Setup of ${pluginName} has been skipped due to missing dependencies.`));
            return false;
        }
        const { nextAccept } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'nextAccept',
                message: `${chalk_1.default.cyan(`${chalk_1.default.bgBlue('Do you want')} to continue with the setup of ${pluginName}?`)}`,
                default: true,
            },
        ]);
        if (!nextAccept) {
            console.log(chalk_1.default.yellow(`Setup of ${pluginName} has been skipped.`));
            return false;
        }
        let handlebarsPayload = {
            name: pluginConfig.name,
            description: pluginConfig.description,
            pluginName,
        };
        const varNames = pluginConfig.variables?.map((v) => v.name);
        if (!varNames?.length) {
            console.log(chalk_1.default.yellow(`No settings found for ${pluginName}. Skipping setup.`));
        }
        else {
            const { setupCommon } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'setupCommon',
                    message: `${chalk_1.default.cyan(`${chalk_1.default.bgBlue('Do you want')} to configure ${pluginName} settings?`)}`,
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
                    for (const envKey in envAnswers) {
                        const v = vars.find(v => v.name === envKey);
                        if (v?.alias) {
                            envAnswers[v.alias] = envAnswers[envKey];
                        }
                    }
                    handlebarsPayload = { ...handlebarsPayload, ...envAnswers };
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
        const name = pluginConfig.name || pluginName;
        const pascalCaseName = (0, format_1.toPascalCase)(name);
        const payload = {
            ...handlebarsPayload,
            pluginName: name,
            className: pascalCaseName,
            classname: pascalCaseName,
            packageName: pluginName,
        };
        const packagePath = path_1.default.resolve(projectDir, 'node_modules', pluginName);
        if (pluginConfig.files && pluginConfig.files.length) {
            await copyPluginFiles(packagePath, projectDir, pluginConfig.files, payload);
        }
        if (pluginConfig?.postFileModifications?.length) {
            await (0, modifications_1.fileModifications)(pluginName, projectDir, pluginConfig.postFileModifications, payload);
        }
        console.log(chalk_1.default.green(`${pluginName} setup has been successfully completed.`));
        if (pluginConfig.postMessages && pluginConfig.postMessages.length) {
            for (const message of pluginConfig.postMessages) {
                try {
                    const template = handlebars_1.default.compile(message);
                    console.log(chalk_1.default.green(`- ${template(handlebarsPayload)}`));
                }
                catch (e) {
                    console.error(chalk_1.default.red(`Error while rendering post message: ${e.message}`));
                }
            }
        }
        return payload;
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error while setting up ${pluginName} settings: ${error.message}`));
        return false;
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
                message: chalk_1.default.cyan(`${chalk_1.default.blue("Do you want")} to add these scripts to your package.json?`),
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
async function copyPluginFiles(packagePath, projectDir, mappings, payload) {
    try {
        const filesToCopy = [];
        for (const { source, destination, overwrite = false, isHandlebarsTemplate } of mappings) {
            const resolvedDest = path_1.default.resolve(projectDir, destination);
            const files = glob_1.glob.sync(source, { cwd: packagePath });
            if (files.length === 0) {
                continue;
            }
            for (const file of files) {
                let sourceFile = path_1.default.resolve(packagePath, file);
                const fileName = path_1.default.basename(file);
                let targetPath = (0, cwd_1.isDirectoryPath)(resolvedDest) ? path_1.default.join(resolvedDest, fileName) : resolvedDest;
                targetPath = (0, cwd_1.replacePlaceholdersInPath)(targetPath, payload, payload.kebabcase);
                const isExisting = fs_extra_1.default.existsSync(targetPath);
                if (!overwrite && isExisting) {
                    console.log(chalk_1.default.yellow(`⚠️ Skipping: File already exists: ${targetPath}`));
                    continue;
                }
                filesToCopy.push({ sourceFile, isHandlebarsTemplate: isHandlebarsTemplate ? true : false, targetPath, overwrite, isExisting });
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
                    message: chalk_1.default.cyan(`${chalk_1.default.blue("Do you want")} to add these files to your project?`),
                    default: true,
                },
            ]);
            if (!accepted) {
                console.log(chalk_1.default.yellow('❌ Files were not added to the project.'));
                return;
            }
            for (const { sourceFile, targetPath, isHandlebarsTemplate, overwrite } of filesToCopy) {
                fs_extra_1.default.ensureDirSync(path_1.default.dirname(targetPath));
                if (!isHandlebarsTemplate) {
                    fs_extra_1.default.copySync(sourceFile, targetPath, { overwrite });
                }
                else {
                    try {
                        const template = handlebars_1.default.compile(fs_extra_1.default.readFileSync(sourceFile, 'utf-8'));
                        fs_extra_1.default.writeFileSync(targetPath, template(payload));
                    }
                    catch (e) {
                        console.error(chalk_1.default.red(`Error while rendering handlebars template: ${e.message}`));
                    }
                }
                console.log(chalk_1.default.green(`✅ File "${targetPath}" has been added to the project.`));
            }
        }
    }
    catch (error) {
        console.error(`❌ Error copying plugin files: ${error.message}`);
    }
}
//# sourceMappingURL=setup-plugin.js.map