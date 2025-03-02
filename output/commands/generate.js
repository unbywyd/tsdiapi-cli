"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = generate;
exports.generateFiles = generateFiles;
exports.generateFeature = generateFeature;
exports.safeGenerate = safeGenerate;
exports.generateNewService = generateNewService;
exports.generateNewController = generateNewController;
const config_1 = require("../config");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const format_1 = require("../utils/format");
const path_1 = __importDefault(require("path"));
const inquirer_2 = require("../utils/inquirer");
const glob_1 = require("glob");
const cwd_1 = require("../utils/cwd");
const modifications_1 = require("../utils/modifications");
const ora_1 = __importDefault(require("ora"));
const npm_1 = require("../utils/npm");
const handlebars_1 = __importStar(require("../utils/handlebars"));
const is_plg_installed_1 = require("../utils/is-plg-installed");
const app_finder_1 = require("../utils/app-finder");
const plg_metadata_1 = require("../utils/plg-metadata");
async function generate(pluginName, fileName, generatorName) {
    try {
        const args = {
            name: fileName
        };
        if (args.name) {
            const validName = /^(?!.*\.\.)([a-zA-Z0-9-_\/]+)$/;
            if (!validName.test(args.name)) {
                return console.log(chalk_1.default.red(`Invalid name: ${args.name}! Name must be a valid directory path containing only letters, numbers, hyphens, underscores, and slashes.`));
            }
        }
        if (pluginName === 'feature') {
            if (!generatorName) {
                console.log(chalk_1.default.bgRed.white.bold("⚠️ ERROR ") +
                    chalk_1.default.red(` Feature name is required!\n\n`) +
                    chalk_1.default.yellow(`Usage: tsdiapi generate feature <name>\n`) +
                    chalk_1.default.cyan(`Example: tsdiapi generate feature user`));
                process.exit(1);
            }
            return generateFeature(generatorName);
        }
        // Local generators
        if (pluginName === 'controller' || pluginName === 'service') {
            if (!generatorName) {
                console.log(chalk_1.default.bgRed.white.bold("⚠️ ERROR ") +
                    chalk_1.default.red(` Generator name is required!\n\n`) +
                    chalk_1.default.yellow(`Usage: tsdiapi generate ${pluginName} <name>\n`) +
                    chalk_1.default.cyan(`Example: tsdiapi generate ${pluginName} user`));
                process.exit(1);
            }
            return safeGenerate(pluginName, generatorName, args);
        }
        const currentDirectory = await (0, app_finder_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        const packageName = (0, config_1.getPackageName)(pluginName);
        const isInstalled = await (0, is_plg_installed_1.isPackageInstalled)(currentDirectory, packageName);
        if (!isInstalled) {
            return console.log(chalk_1.default.red(`Plugin ${pluginName} is not installed!`));
        }
        const config = await (0, plg_metadata_1.getPluginMetadata)(currentDirectory, packageName);
        const generators = config?.generators || [];
        if (!generators.length) {
            return console.log(chalk_1.default.red(`Plugin ${pluginName} does not have any generators!`));
        }
        const generatorByName = generatorName ? generators.find((g) => g.name === generatorName) : null;
        if (generatorName && !generatorByName) {
            if (generators?.length > 1) {
                return console.log(chalk_1.default.red(`Generator ${generatorName} not found in plugin ${pluginName}!`));
            }
            else {
                // Мы не нашли генератор, но у нас всего один генератор, поэтому используем его уведомим пользователя о том, что мы взяли его
                const selectedGeneratorName = generators[0].name;
                console.log(chalk_1.default.yellow(`Generator ${generatorName} not found in plugin ${pluginName}! Using ${selectedGeneratorName} instead.`));
            }
        }
        let currentGenerator = generatorByName || generators[0];
        if (currentGenerator?.preMessages && currentGenerator.preMessages.length) {
            for (const message of currentGenerator.preMessages) {
                try {
                    const msg = handlebars_1.default.compile(message)(args);
                    console.log(chalk_1.default.green(`- ${msg}`));
                }
                catch (error) {
                    console.error(chalk_1.default.red(`❌ Handlebars error: ${error.message}`));
                }
            }
        }
        if (currentGenerator.requiredPackages?.length) {
            console.log(chalk_1.default.blue(`Checking required packages for generator ${currentGenerator.name}...`));
            for (const packageName of currentGenerator.requiredPackages) {
                const isInstalled = await (0, is_plg_installed_1.isPackageInstalled)(currentDirectory, packageName);
                if (!isInstalled) {
                    return console.log(chalk_1.default.red(`Plugin ${packageName} is required for generator ${currentGenerator.name}!`));
                }
                else {
                    console.log(chalk_1.default.green(`✅ Required plugin ${packageName} is present in the project!`));
                }
            }
        }
        if (currentGenerator?.requiredPaths?.length) {
            console.log(chalk_1.default.blue(`Checking required paths for generator ${currentGenerator.name}...`));
            for (const requiredPath of currentGenerator.requiredPaths) {
                if (!(0, cwd_1.isValidRequiredPath)(requiredPath)) {
                    console.log(chalk_1.default.red(`Invalid required path: ${requiredPath}!`));
                    console.log(chalk_1.default.red(`Invalid required path: ${requiredPath}! Path should be relative to the root of the project and point to a specific file. Please check your plugin configuration.`));
                    return;
                }
                const fullPath = path_1.default.join(currentDirectory, requiredPath);
                if (!fs_extra_1.default.existsSync(fullPath)) {
                    console.log(chalk_1.default.bgYellow.white.bold(" ⚠️ DENIED ") +
                        chalk_1.default.red(` Required path not found: ${requiredPath}! This file is required to start the generation process.`));
                    return;
                }
            }
        }
        if (!generatorByName && generators?.length > 1) {
            const generatorNames = generators.map(g => g.name);
            try {
                const answer = await inquirer_1.default.prompt([
                    {
                        type: 'list',
                        name: 'generator',
                        message: 'Select a generator:',
                        choices: generatorNames
                    }
                ]);
                currentGenerator = generators.find(g => g.name === answer.generator);
            }
            catch (e) {
                console.log(chalk_1.default.red('Operation canceled!'));
                return;
            }
        }
        if (!currentGenerator) {
            return console.log(chalk_1.default.red(`Generator ${generatorName} not found in plugin ${pluginName}!`));
        }
        if (currentGenerator.description) {
            console.log(chalk_1.default.green(`Selected generator: ${currentGenerator.name} - ${currentGenerator.description}`));
        }
        else {
            console.log(chalk_1.default.green(`Selected generator: ${currentGenerator.name}`));
        }
        let defaultObj = args || {};
        const plugArgs = currentGenerator?.args || [];
        const plugFiles = currentGenerator?.files || [];
        if (!plugFiles.length) {
            return console.log(chalk_1.default.red(`Generator ${currentGenerator.name} does not have any files!`));
        }
        const isConfigurable = plugArgs.length > 0;
        const nameIsUndefined = !defaultObj.name;
        if (isConfigurable || nameIsUndefined) {
            const questions = plugArgs.filter(a => a.inquirer && a.name !== 'name').map((arg) => {
                const defaultValue = args?.[arg.name] || arg.inquirer?.default || "";
                return {
                    ...arg.inquirer,
                    name: arg.name,
                    default: defaultValue,
                    message: arg?.inquirer?.message || arg.description || '',
                    validate: arg.validate ? (0, inquirer_2.validateInput)(arg.validate) : undefined,
                    filter: arg.transform ? (0, inquirer_2.applyTransform)(arg.transform) : undefined,
                    when: (0, inquirer_2.convertWhenToFunction)(arg.when)
                };
            });
            if (nameIsUndefined) {
                questions.unshift({
                    type: 'input',
                    name: 'name',
                    message: 'Enter the name:',
                    validate: (value) => {
                        const validName = /^(?!.*\.\.)([a-zA-Z0-9-_\/]+)$/;
                        const pass = validName
                            .test(value);
                        if (pass) {
                            return true;
                        }
                    },
                    required: true,
                });
            }
            if (questions?.length) {
                try {
                    const result = await inquirer_1.default.prompt(questions);
                    if (result) {
                        defaultObj = {
                            ...defaultObj,
                            ...result
                        };
                    }
                }
                catch (e) {
                    console.log(chalk_1.default.red('Operation canceled!'));
                    return;
                }
            }
        }
        if (!defaultObj.name) {
            console.log(chalk_1.default.red('Name is required!'));
            return;
        }
        const name = defaultObj.name;
        const baseName = path_1.default.basename(name);
        const pascalCaseName = (0, format_1.toPascalCase)(baseName);
        const kebabCaseName = (0, format_1.toKebabCase)(baseName);
        defaultObj = {
            ...defaultObj,
            name,
            pluginName: config?.name,
            basename: kebabCaseName,
            baseName: kebabCaseName,
            classname: pascalCaseName,
            className: pascalCaseName,
            packageName: packageName,
            packagename: packageName,
        };
        // Add alias values to the default object
        for (const key in defaultObj) {
            const sourceArg = plugArgs.find(a => a.name === key);
            if (sourceArg?.alias && !(sourceArg.alias in defaultObj)) {
                defaultObj[sourceArg.alias] = defaultObj[key];
            }
        }
        const _fileModifications = currentGenerator?.fileModifications || [];
        try {
            if (modifications_1.fileModifications.length) {
                await (0, modifications_1.fileModifications)(pluginName, currentDirectory, _fileModifications, defaultObj);
            }
        }
        catch (error) {
            console.error(`❌ ${currentGenerator.name} generator error: ${error.message}`);
        }
        await generateFiles(currentGenerator, defaultObj, currentDirectory, plugFiles);
        if (currentGenerator.afterGenerate) {
            const spinner = (0, ora_1.default)().start();
            try {
                try {
                    const cond = currentGenerator.afterGenerate?.when ? (0, inquirer_2.convertWhenToFunction)(currentGenerator.afterGenerate?.when)(defaultObj) : true;
                    if (cond) {
                        spinner.text = chalk_1.default.blue(`⚙️ Running after-generate script...`);
                        await (0, npm_1.runPostInstall)(pluginName, currentDirectory, currentGenerator.afterGenerate?.command);
                        spinner.succeed(chalk_1.default.green(`✅ Completed after-generate script!`));
                    }
                }
                catch (e) {
                    spinner.fail(chalk_1.default.red(`❌ Error running after-generate script: ${e.message}`));
                }
            }
            catch (error) {
                spinner.fail(chalk_1.default.red(`❌ Error running after-setup script: ${error.message}`));
            }
        }
        if (currentGenerator.postMessages && currentGenerator.postMessages.length) {
            for (const message of currentGenerator.postMessages) {
                try {
                    const msg = handlebars_1.default.compile(message)(defaultObj);
                    console.log(chalk_1.default.green(`- ${msg}`));
                }
                catch (error) {
                    console.error(chalk_1.default.red(`❌ Handlebars error: ${error.message}`));
                }
            }
        }
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating plugin:', e));
    }
}
async function generateFiles(currentGenerator, defaultObj, currentDirectory, plugFiles) {
    try {
        const filesToGenerate = [];
        const { name, packageName } = defaultObj;
        const cwd = (0, cwd_1.resolveTargetDirectory)(process.cwd(), name);
        const packagePath = path_1.default.join(currentDirectory, 'node_modules', packageName);
        for (const { source, destination, overwrite = false, isHandlebarsTemplate, isRoot } of plugFiles) {
            const toCwd = isRoot ? currentDirectory : cwd;
            const destinationPrepared = destination.replace(/{{name}}/g, defaultObj.name);
            const resolvedDest = path_1.default.resolve(toCwd, (0, cwd_1.replacePlaceholdersInPath)(destinationPrepared, defaultObj, (0, format_1.toKebabCase)(defaultObj.name)));
            const files = glob_1.glob.sync(source, { cwd: packagePath });
            if (files.length === 0) {
                continue;
            }
            for (const file of files) {
                const sourceFile = path_1.default.resolve(packagePath, file);
                const fileName = path_1.default.basename(file);
                const targetPath = (0, cwd_1.isDirectoryPath)(resolvedDest) ? path_1.default.join(resolvedDest, fileName) : resolvedDest;
                const outputPath = (0, cwd_1.replacePlaceholdersInPath)(targetPath, defaultObj, (0, format_1.toKebabCase)(defaultObj.name));
                if (fs_extra_1.default.existsSync(outputPath)) {
                    console.log(chalk_1.default.yellow(`⚠️ Skipping: File already exists: ${outputPath}`));
                    continue;
                }
                filesToGenerate.push({
                    sourceFile,
                    outputPath,
                    overwrite,
                    hbsRequired: isHandlebarsTemplate
                });
            }
        }
        if (filesToGenerate.length === 0) {
            //console.log(chalk.red(`❌ No files found to generate!`));
            return;
        }
        console.log(chalk_1.default.blue(`\n🔹 The following files will be generated:\n`));
        for (const { outputPath } of filesToGenerate) {
            console.log(`${chalk_1.default.green('🟡 (new)')} ${chalk_1.default.gray(outputPath)}`);
        }
        console.log('\n');
        const { accepted } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'accepted',
                message: chalk_1.default.cyan(`${chalk_1.default.bgBlue('Do you want')} to generate ${filesToGenerate.length} files?`),
                default: true,
            },
        ]);
        if (!accepted) {
            console.log(chalk_1.default.yellow(`❌ Operation cancelled by the user.`));
            return;
        }
        console.log(chalk_1.default.blue(`\n📂 Generating files...\n`));
        for (const { sourceFile, outputPath, overwrite, hbsRequired } of filesToGenerate) {
            if (hbsRequired) {
                const content = (0, handlebars_1.buildHandlebarsTemplateWithPath)(sourceFile, defaultObj);
                await fs_extra_1.default.outputFile(outputPath, content || '');
            }
            else {
                fs_extra_1.default.copySync(sourceFile, outputPath, { overwrite: overwrite });
            }
            console.log(chalk_1.default.green(`✅ Created: ${outputPath}`));
        }
        console.log(chalk_1.default.green(`\n🎉 ${plugFiles.length} files have been successfully generated!\n`));
    }
    catch (error) {
        console.error(`❌ ${currentGenerator.name} generator error: ${error.message}`);
    }
}
async function generateFeature(name, projectDir) {
    try {
        console.log(chalk_1.default.cyan.bold("\n🚀 Generating New Feature\n"));
        const currentDirectory = projectDir || await (0, app_finder_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            return console.log(chalk_1.default.bgRed.white.bold(" ⚠ ERROR ") +
                chalk_1.default.red(" Not found package.json or maybe you are not using @tsdiapi/server!\n"));
        }
        const featurePath = path_1.default.join(currentDirectory, "src/api/features", name);
        if (fs_extra_1.default.existsSync(featurePath)) {
            console.log(chalk_1.default.bgRed.white.bold(" ⚠ ERROR ") +
                chalk_1.default.red(` The feature ${chalk_1.default.bold(name)} already exists in the project.\n`));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`📌 Feature will be created at: ${chalk_1.default.yellow(featurePath)}\n`));
        if (!projectDir) {
            const { accepted } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "accepted",
                    message: chalk_1.default.cyan(`${chalk_1.default.bgBlue('Do you want')} to generate a new feature named ${chalk_1.default.bold(name)}?`),
                    default: true,
                },
            ]);
            if (!accepted) {
                console.log(chalk_1.default.yellow("❌ Operation cancelled by the user.\n"));
                return;
            }
        }
        console.log(chalk_1.default.cyan("📂 Creating feature structure...\n"));
        await fs_extra_1.default.mkdirp(featurePath);
        const servicePath = await generateNewService(name, featurePath);
        const controllerPath = await generateNewController(name, featurePath, true);
        console.log(chalk_1.default.green.bold("\n✅ Feature successfully generated! 🎉\n"));
        console.log(chalk_1.default.yellow("🗂️ Created files:"));
        const relFeaturePath = path_1.default.relative(currentDirectory, featurePath);
        console.log(`   📂 Feature Path: ${chalk_1.default.blue(relFeaturePath)}`);
        if (servicePath) {
            const relPath = path_1.default.relative(currentDirectory, servicePath);
            console.log(`   📄 Service:      ${chalk_1.default.green(relPath)}`);
        }
        if (controllerPath) {
            const relPath = path_1.default.relative(currentDirectory, controllerPath);
            console.log(`   📄 Controller:   ${chalk_1.default.green(relPath)}`);
        }
        console.log(chalk_1.default.green.bold(`🚀 Feature ${chalk_1.default.bold(relFeaturePath)} is ready to use!\n`));
    }
    catch (e) {
        console.error(chalk_1.default.bgRed.white.bold(" ❌ ERROR ") +
            chalk_1.default.red(` An error occurred while generating the feature:\n${e.message}\n`));
    }
}
async function safeGenerate(pluginName, generatorName, args) {
    const cwd = (0, cwd_1.resolveTargetDirectory)(process.cwd(), generatorName);
    const name = path_1.default.basename(generatorName);
    try {
        const { accepted } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'accepted',
                message: chalk_1.default.cyan(`Do you want to generate ${chalk_1.default.blue.bold(`${name} ${pluginName}`)} in ${cwd}?`),
                default: true,
            },
        ]);
        if (!accepted) {
            console.log(chalk_1.default.yellow(`❌ Operation cancelled by the user.`));
            return;
        }
        if (pluginName === 'controller') {
            await generateNewController(name, cwd, args?.service || false);
        }
        else if (pluginName === 'service') {
            await generateNewService(name, cwd);
        }
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating plugin:', e));
    }
}
async function generateNewService(name, dir) {
    try {
        const pascalCase = (0, format_1.toPascalCase)(name);
        const kebabCaseName = (0, format_1.toKebabCase)(name);
        const filename = `${kebabCaseName}.service.ts`;
        const className = `${pascalCase}Service`;
        const targetPath = path_1.default.join(dir, filename);
        if (fs_extra_1.default.existsSync(targetPath)) {
            console.log(chalk_1.default.red(`⚠️ The service ${chalk_1.default.bold(filename)} already exists in the target directory.`));
            return null;
        }
        const content = (0, handlebars_1.buildHandlebarsTemplate)('generator/service', {
            className: className,
        });
        await fs_extra_1.default.outputFile(targetPath, content);
        console.log(chalk_1.default.green(`✅ Service generated at: ${targetPath}`));
        return targetPath;
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating service:', e));
        return null;
    }
}
async function generateNewController(name, dir, withService = false) {
    try {
        const pascalCase = (0, format_1.toPascalCase)(name);
        const kebabCaseName = (0, format_1.toKebabCase)(name);
        const filename = `${kebabCaseName}.controller.ts`;
        const className = `${pascalCase}Controller`;
        const targetPath = path_1.default.join(dir, filename);
        if (fs_extra_1.default.existsSync(targetPath)) {
            console.log(chalk_1.default.red(`⚠️ The controller ${chalk_1.default.bold(filename)} already exists in the target directory.`));
            return null;
        }
        const content = (0, handlebars_1.buildHandlebarsTemplate)('generator/controller', {
            className: className,
            kebabCaseName: kebabCaseName,
            serviceCamelCaseName: withService ? `${(0, format_1.toCamelCase)(name)}Service` : null,
            serviceClassName: withService ? `${pascalCase}Service` : null,
        });
        await fs_extra_1.default.outputFile(targetPath, content);
        console.log(chalk_1.default.green(`✅ Controller generated at: ${targetPath}`));
        return targetPath;
    }
    catch (e) {
        console.error(chalk_1.default.red('Error generating controller:', e));
        return null;
    }
}
//# sourceMappingURL=generate.js.map