"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = generate;
exports.replacePlaceholdersInPath = replacePlaceholdersInPath;
exports.generateFeature = generateFeature;
exports.safeGenerate = safeGenerate;
exports.generateNewService = generateNewService;
exports.generateNewController = generateNewController;
const config_1 = require("./../config");
const chalk_1 = __importDefault(require("chalk"));
const plugins_1 = require("./plugins");
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const format_1 = require("./format");
const path_1 = __importDefault(require("path"));
const inquirer_2 = require("./inquirer");
const glob_1 = require("glob");
const hbs_1 = require("./hbs");
const cwd_1 = require("./cwd");
async function generate(pluginName, generatorName, _args) {
    try {
        const args = _args || {};
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
        const currentDirectory = await (0, plugins_1.findTSDIAPIServerProject)();
        if (!currentDirectory) {
            return console.log(chalk_1.default.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        const packageName = (0, config_1.getPackageName)(pluginName);
        const isInstalled = await (0, plugins_1.isPackageInstalled)(currentDirectory, packageName);
        if (!isInstalled) {
            return console.log(chalk_1.default.red(`Plugin ${pluginName} is not installed!`));
        }
        const config = await (0, plugins_1.getPluginMetadata)(currentDirectory, packageName);
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
                    defaultObj = await inquirer_1.default.prompt(questions);
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
        const camelCaseName = (0, format_1.toCamelCase)(baseName);
        const pascalCaseName = (0, format_1.toPascalCase)(baseName);
        const kebabCaseName = (0, format_1.toKebabCase)(baseName);
        defaultObj = {
            ...defaultObj,
            name,
            camelcase: camelCaseName,
            camelCase: camelCaseName,
            pascalcase: pascalCaseName,
            pascalCase: pascalCaseName,
            kebabcase: kebabCaseName,
            kebabCase: kebabCaseName,
            basename: kebabCaseName,
            baseName: kebabCaseName,
            classname: pascalCaseName,
            className: pascalCaseName
        };
        const filesToGenerate = [];
        try {
            const cwd = (0, cwd_1.resolveTargetDirectory)(process.cwd(), name);
            const packagePath = path_1.default.join(currentDirectory, 'node_modules', packageName);
            for (const { source, destination, overwrite = false, isHandlebarsTemplate } of plugFiles) {
                const resolvedDest = path_1.default.resolve(cwd, destination);
                const files = glob_1.glob.sync(source, { cwd: packagePath });
                if (files.length === 0) {
                    continue;
                }
                for (const file of files) {
                    const sourceFile = path_1.default.resolve(packagePath, file);
                    const fileName = path_1.default.basename(file);
                    const targetPath = (0, cwd_1.isDirectoryPath)(resolvedDest) ? path_1.default.join(resolvedDest, fileName) : resolvedDest;
                    const outputPath = replacePlaceholdersInPath(targetPath, defaultObj, name);
                    if (fs_extra_1.default.existsSync(outputPath)) {
                        console.log(`⚠️ Skipping: File already exists: ${outputPath}`);
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
                console.log(chalk_1.default.red(`❌ No files found to generate!`));
                return;
            }
            console.log(chalk_1.default.blue(`\n🔹 The following files will be generated:\n`));
            for (const { outputPath } of filesToGenerate) {
                console.log(`${chalk_1.default.green('🟡 (new)')} ${chalk_1.default.white(outputPath)}`);
            }
            console.log('\n');
            const { accepted } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'accepted',
                    message: `Do you want to generate ${filesToGenerate.length} files?`,
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
                    const content = (0, hbs_1.buildHandlebarsTemplateWithPath)(sourceFile, defaultObj);
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
    catch (e) {
        console.error(chalk_1.default.red('Error generating plugin:', e));
    }
}
function replacePlaceholdersInPath(filePath, replacements, defaultName) {
    const dir = path_1.default.dirname(filePath);
    let ext = path_1.default.extname(filePath);
    let fileName = path_1.default.basename(filePath, ext);
    fileName = fileName.replace(/\[([^\]]+)\]/g, (_, key) => replacements[key] || "");
    if (!/[a-zA-Z0-9]/.test(fileName)) {
        fileName = defaultName;
    }
    return path_1.default.join(dir, `${fileName}${ext}`);
}
async function generateFeature(name, projectDir) {
    try {
        console.log(chalk_1.default.cyan.bold("\n🚀 Generating New Feature\n"));
        const currentDirectory = projectDir || await (0, plugins_1.findTSDIAPIServerProject)();
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
                    message: `🛠️ Do you want to generate a new feature named ${chalk_1.default.bold(name)}?`,
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
                message: `Do you want to generate ${chalk_1.default.blue.bold(`${name} ${pluginName}`)} in ${cwd}?`,
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
        const content = (0, hbs_1.buildHandlebarsTemplate)('generator/service', {
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
        const content = (0, hbs_1.buildHandlebarsTemplate)('generator/controller', {
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