import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import { glob } from "glob";
import ora from 'ora';
import { getPackageName } from '../config.js';
import { toCamelCase, toKebabCase, toPascalCase } from "../utils/format.js";
import { applyTransform, convertWhenToFunction, validateInput } from '../utils/inquirer.js';
import { isDirectoryPath, isValidRequiredPath, replacePlaceholdersInPath, resolveTargetDirectory } from '../utils/cwd.js';
import { fileModifications } from '../utils/modifications.js';
import { runPostInstall } from '../utils/npm.js';
import Handlebars, { buildHandlebarsTemplate, buildHandlebarsTemplateWithPath } from '../utils/handlebars.js';
import { isPackageInstalled } from '../utils/is-plg-installed.js';
import { findTSDIAPIServerProject } from '../utils/app-finder.js';
import { getPluginMetadata } from '../utils/plg-metadata.js';
import { checkPrismaExist } from "../utils/check-prisma-exists.js";
import { applyPrismaScripts } from "../utils/apply-prisma-scripts.js";
export async function generate(pluginName, fileName, generatorName, toFeature) {
    try {
        const args = {
            name: fileName
        };
        if (args.name) {
            const validName = /^(?!.*\.\.)([a-zA-Z0-9-_\/]+)$/;
            if (!validName.test(args.name)) {
                return console.log(chalk.red(`Invalid name: ${args.name}! Name must be a valid directory path containing only letters, numbers, hyphens, underscores, and slashes.`));
            }
        }
        if (pluginName === 'feature') {
            if (!fileName) {
                console.log(chalk.bgRed.white.bold("⚠️ ERROR ") +
                    chalk.red(` Feature name is required!\n\n`) +
                    chalk.yellow(`Usage: tsdiapi generate feature <name>\n`) +
                    chalk.cyan(`Example: tsdiapi generate feature user`));
                process.exit(1);
            }
            return generateFeature(fileName);
        }
        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }
        // Local generators
        if ((pluginName === 'controller' || pluginName === 'service')) {
            if (!fileName) {
                console.log(chalk.bgRed.white.bold("⚠️ ERROR ") +
                    chalk.red(` Generator name is required!\n\n`) +
                    chalk.yellow(`Usage: tsdiapi generate ${pluginName} <name>\n`) +
                    chalk.cyan(`Example: tsdiapi generate ${pluginName} user`));
                process.exit(1);
            }
            const output = toFeature ? path.join(currentDirectory, 'src/api/features', toFeature) : fileName;
            return safeGenerate(pluginName, output, args, toFeature ? fileName : undefined);
        }
        const packageName = getPackageName(pluginName);
        const isInstalled = await isPackageInstalled(currentDirectory, packageName);
        if (!isInstalled) {
            return console.log(chalk.red(`Plugin ${pluginName} is not installed!`));
        }
        const config = await getPluginMetadata(currentDirectory, packageName);
        const generators = config?.generators || [];
        if (!generators.length) {
            return console.log(chalk.red(`Plugin ${pluginName} does not have any generators!`));
        }
        const generatorByName = generatorName ? generators.find((g) => g.name === generatorName) : null;
        if (generatorName && !generatorByName) {
            if (generators?.length > 1) {
                return console.log(chalk.red(`Generator ${generatorName} not found in plugin ${pluginName}!`));
            }
            else {
                // Мы не нашли генератор, но у нас всего один генератор, поэтому используем его уведомим пользователя о том, что мы взяли его
                const selectedGeneratorName = generators[0].name;
                console.log(chalk.yellow(`Generator ${generatorName} not found in plugin ${pluginName}! Using ${selectedGeneratorName} instead.`));
            }
        }
        let currentGenerator = generatorByName || generators[0];
        if (currentGenerator?.preMessages && currentGenerator.preMessages.length) {
            for (const message of currentGenerator.preMessages) {
                try {
                    const msg = Handlebars.compile(message)(args);
                    console.log(chalk.gray(`- ${msg}`));
                }
                catch (error) {
                    console.error(chalk.red(`❌ Handlebars error: ${error.message}`));
                }
            }
        }
        // Check prisma required scripts
        if (currentGenerator?.prismaScripts?.length) {
            const prismaExists = await checkPrismaExist(currentDirectory);
            console.log(chalk.yellowBright(`⚠️ The generator ${pluginName} requires Prisma and will extend it by executing the following scripts:`));
            const prismaScripts = currentGenerator.prismaScripts;
            for (const script of prismaScripts) {
                console.log(chalk.yellow(`- ${script.description}`));
            }
            console.log(chalk.blue(`Checking required dependencies for plugin ${pluginName}...`));
            for (const message of prismaExists?.results) {
                console.log(`- ${message}`);
            }
            if (!prismaExists.prismaExist) {
                console.log(chalk.red(`Prisma is required for generator ${currentGenerator.name}!`));
                return console.log(chalk.red(`Please install Prisma via ${chalk.cyan('tsdiapi plugins add @tsdiapi/prisma')} or manually and run ${chalk.cyan('prisma init')}`));
            }
        }
        if (currentGenerator.requiredPackages?.length) {
            console.log(chalk.blue(`Checking required packages for generator ${currentGenerator.name}...`));
            for (const packageName of currentGenerator.requiredPackages) {
                const isInstalled = await isPackageInstalled(currentDirectory, packageName);
                if (!isInstalled) {
                    return console.log(chalk.red(`Plugin ${packageName} is required for generator ${currentGenerator.name}!`));
                }
                else {
                    console.log(chalk.green(`✅ Required plugin ${packageName} is present in the project!`));
                }
            }
        }
        if (currentGenerator?.requiredPaths?.length) {
            console.log(chalk.blue(`Checking required paths for generator ${currentGenerator.name}...`));
            for (const requiredPath of currentGenerator.requiredPaths) {
                if (!isValidRequiredPath(requiredPath)) {
                    console.log(chalk.red(`Invalid required path: ${requiredPath}!`));
                    console.log(chalk.red(`Invalid required path: ${requiredPath}! Path should be relative to the root of the project and point to a specific file. Please check your plugin configuration.`));
                    return;
                }
                const fullPath = path.join(currentDirectory, requiredPath);
                if (!fs.existsSync(fullPath)) {
                    console.log(chalk.bgYellow.white.bold(" ⚠️ DENIED ") +
                        chalk.red(` Required path not found: ${requiredPath}! This file is required to start the generation process.`));
                    return;
                }
            }
        }
        if (!generatorByName && generators?.length > 1) {
            const generatorNames = generators.map(g => g.name);
            try {
                const answer = await inquirer.prompt([
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
                console.log(chalk.red('Operation canceled!'));
                return;
            }
        }
        if (!currentGenerator) {
            return console.log(chalk.red(`Generator ${generatorName} not found in plugin ${pluginName}!`));
        }
        if (currentGenerator.description) {
            console.log(chalk.green(`Selected generator: ${currentGenerator.name} - ${currentGenerator.description}`));
        }
        else {
            console.log(chalk.green(`Selected generator: ${currentGenerator.name}`));
        }
        let defaultObj = args || {};
        const plugArgs = currentGenerator?.args || [];
        const plugFiles = currentGenerator?.files || [];
        if (!plugFiles.length) {
            return console.log(chalk.red(`Generator ${currentGenerator.name} does not have any files!`));
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
                    validate: arg.validate ? validateInput(arg.validate) : undefined,
                    filter: arg.transform ? applyTransform(arg.transform) : undefined,
                    when: convertWhenToFunction(arg.when)
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
                    const result = await inquirer.prompt(questions);
                    if (result) {
                        defaultObj = {
                            ...defaultObj,
                            ...result
                        };
                    }
                }
                catch (e) {
                    console.log(chalk.red('Operation canceled!'));
                    return;
                }
            }
        }
        if (!defaultObj.name) {
            console.log(chalk.red('Name is required!'));
            return;
        }
        const name = defaultObj.name;
        const baseName = path.basename(name);
        const pascalCaseName = toPascalCase(baseName);
        const kebabCaseName = toKebabCase(baseName);
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
        if (currentGenerator?.prismaScripts?.length) {
            try {
                const result = await applyPrismaScripts(currentDirectory, currentGenerator.prismaScripts, defaultObj);
                if (!result) {
                    return console.error(chalk.red(`Error applying Prisma scripts!`));
                }
            }
            catch (e) {
                return console.error(chalk.red(`Error applying Prisma scripts: ${e.message}`));
            }
        }
        const _fileModifications = currentGenerator?.fileModifications || [];
        try {
            if (fileModifications.length) {
                await fileModifications(pluginName, currentDirectory, _fileModifications, defaultObj);
            }
        }
        catch (error) {
            console.error(`❌ ${currentGenerator.name} generator error: ${error.message}`);
        }
        await generateFiles(currentGenerator, defaultObj, currentDirectory, plugFiles);
        if (currentGenerator.afterGenerate) {
            const spinner = ora().start();
            try {
                try {
                    const cond = currentGenerator.afterGenerate?.when ? convertWhenToFunction(currentGenerator.afterGenerate?.when)(defaultObj) : true;
                    if (cond) {
                        spinner.text = chalk.blue(`⚙️ Running after-generate script...`);
                        await runPostInstall(pluginName, currentDirectory, currentGenerator.afterGenerate?.command);
                        spinner.succeed(chalk.green(`✅ Completed after-generate script!`));
                    }
                }
                catch (e) {
                    spinner.fail(chalk.red(`❌ Error running after-generate script: ${e.message}`));
                }
            }
            catch (error) {
                spinner.fail(chalk.red(`❌ Error running after-setup script: ${error.message}`));
            }
        }
        const prismaScripts = currentGenerator.prismaScripts, afterGenerate = currentGenerator?.afterGenerate?.command || '';
        if ((prismaScripts?.length) && !afterGenerate.includes('prisma')) {
            const command = 'npm run prisma:generate';
            console.log(chalk.blueBright(`⚙️ Generating Prisma client...`));
            await runPostInstall(pluginName, currentDirectory, command);
            console.log(chalk.green(`✅ Prisma client generated.`));
        }
        if (currentGenerator.postMessages && currentGenerator.postMessages.length) {
            for (const message of currentGenerator.postMessages) {
                try {
                    const msg = Handlebars.compile(message)(defaultObj);
                    console.log(chalk.gray(`- ${msg}`));
                }
                catch (error) {
                    console.error(chalk.red(`❌ Handlebars error: ${error.message}`));
                }
            }
        }
    }
    catch (e) {
        console.error(chalk.red('Error generating plugin:', e));
    }
}
export async function generateFiles(currentGenerator, defaultObj, currentDirectory, plugFiles) {
    try {
        const filesToGenerate = [];
        const { name, packageName } = defaultObj;
        const cwd = resolveTargetDirectory(process.cwd(), name);
        const packagePath = path.join(currentDirectory, 'node_modules', packageName);
        for (const { source, destination, overwrite = false, isHandlebarsTemplate, isRoot } of plugFiles) {
            const toCwd = isRoot ? currentDirectory : cwd;
            const destinationPrepared = destination.replace(/{{name}}/g, defaultObj.name);
            const resolvedDest = path.resolve(toCwd, replacePlaceholdersInPath(destinationPrepared, defaultObj, toKebabCase(defaultObj.name)));
            const files = glob.sync(source, { cwd: packagePath });
            if (files.length === 0) {
                continue;
            }
            for (const file of files) {
                const sourceFile = path.resolve(packagePath, file);
                const fileName = path.basename(file);
                const targetPath = isDirectoryPath(resolvedDest) ? path.join(resolvedDest, fileName) : resolvedDest;
                const outputPath = replacePlaceholdersInPath(targetPath, defaultObj, toKebabCase(defaultObj.name));
                if (fs.existsSync(outputPath)) {
                    console.log(chalk.yellow(`⚠️ Skipping: File already exists: ${outputPath}`));
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
        console.log(chalk.blue(`\n🔹 The following files will be generated:\n`));
        for (const { outputPath } of filesToGenerate) {
            console.log(`${chalk.green('🟡 (new)')} ${chalk.gray(outputPath)}`);
        }
        console.log('\n');
        const { accepted } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'accepted',
                message: chalk.cyan(`${chalk.bgBlue('Do you want')} to generate ${filesToGenerate.length} files?`),
                default: true,
            },
        ]);
        if (!accepted) {
            console.log(chalk.yellow(`❌ Operation cancelled by the user.`));
            return;
        }
        console.log(chalk.blue(`\n📂 Generating files...\n`));
        for (const { sourceFile, outputPath, overwrite, hbsRequired } of filesToGenerate) {
            if (hbsRequired) {
                const content = buildHandlebarsTemplateWithPath(sourceFile, defaultObj);
                await fs.outputFile(outputPath, content || '');
            }
            else {
                fs.copySync(sourceFile, outputPath, { overwrite: overwrite });
            }
            console.log(chalk.green(`✅ Created: ${outputPath}`));
        }
        console.log(chalk.green(`\n🎉 ${plugFiles.length} files have been successfully generated!\n`));
    }
    catch (error) {
        console.error(`❌ ${currentGenerator.name} generator error: ${error.message}`);
    }
}
export async function generateFeature(name, projectDir) {
    try {
        console.log(chalk.cyan.bold("\n🚀 Generating New Feature\n"));
        const currentDirectory = projectDir || await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(chalk.bgRed.white.bold(" ⚠ ERROR ") +
                chalk.red(" Not found package.json or maybe you are not using @tsdiapi/server!\n"));
        }
        const featurePath = path.join(currentDirectory, "src/api/features", name);
        if (fs.existsSync(featurePath)) {
            console.log(chalk.bgRed.white.bold(" ⚠ ERROR ") +
                chalk.red(` The feature ${chalk.bold(name)} already exists in the project.\n`));
            process.exit(1);
        }
        console.log(chalk.blue(`📌 Feature will be created at: ${chalk.yellow(featurePath)}\n`));
        if (!projectDir) {
            const { accepted } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "accepted",
                    message: chalk.cyan(`${chalk.bgBlue('Do you want')} to generate a new feature named ${chalk.bold(name)}?`),
                    default: true,
                },
            ]);
            if (!accepted) {
                console.log(chalk.yellow("❌ Operation cancelled by the user.\n"));
                return;
            }
        }
        console.log(chalk.cyan("📂 Creating feature structure...\n"));
        await fs.mkdirp(featurePath);
        const servicePath = await generateNewService(name, featurePath);
        const controllerPath = await generateNewController(name, featurePath, true);
        console.log(chalk.green.bold("\n✅ Feature successfully generated! 🎉\n"));
        console.log(chalk.yellow("🗂️ Created files:"));
        const relFeaturePath = path.relative(currentDirectory, featurePath);
        console.log(`   📂 Feature Path: ${chalk.blue(relFeaturePath)}`);
        if (servicePath) {
            const relPath = path.relative(currentDirectory, servicePath);
            console.log(`   📄 Service:      ${chalk.green(relPath)}`);
        }
        if (controllerPath) {
            const relPath = path.relative(currentDirectory, controllerPath);
            console.log(`   📄 Controller:   ${chalk.green(relPath)}`);
        }
        console.log(chalk.green.bold(`🚀 Feature ${chalk.bold(relFeaturePath)} is ready to use!\n`));
    }
    catch (e) {
        console.error(chalk.bgRed.white.bold(" ❌ ERROR ") +
            chalk.red(` An error occurred while generating the feature:\n${e.message}\n`));
    }
}
export async function safeGenerate(pluginName, output, args = {}, fName) {
    const cwd = path.isAbsolute(output) ? output : resolveTargetDirectory(process.cwd(), output);
    const name = fName || path.basename(output);
    try {
        const { accepted } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'accepted',
                message: chalk.cyan(`Do you want to generate ${chalk.blue.bold(`${name} ${pluginName}`)} in ${cwd}?`),
                default: true,
            },
        ]);
        if (!accepted) {
            console.log(chalk.yellow(`❌ Operation cancelled by the user.`));
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
        console.error(chalk.red('Error generating plugin:', e));
    }
}
export async function generateNewService(name, dir) {
    try {
        const pascalCase = toPascalCase(name);
        const kebabCaseName = toKebabCase(name);
        const filename = `${kebabCaseName}.service.ts`;
        const className = `${pascalCase}Service`;
        const targetPath = path.join(dir, filename);
        if (fs.existsSync(targetPath)) {
            console.log(chalk.red(`⚠️ The service ${chalk.bold(filename)} already exists in the target directory.`));
            return null;
        }
        const content = buildHandlebarsTemplate('generator/service', {
            className: className,
        });
        await fs.outputFile(targetPath, content);
        console.log(chalk.green(`✅ Service generated at: ${targetPath}`));
        return targetPath;
    }
    catch (e) {
        console.error(chalk.red('Error generating service:', e));
        return null;
    }
}
export async function generateNewController(name, dir, withService = false) {
    try {
        const pascalCase = toPascalCase(name);
        const kebabCaseName = toKebabCase(name);
        const filename = `${kebabCaseName}.controller.ts`;
        const className = `${pascalCase}Controller`;
        const targetPath = path.join(dir, filename);
        if (fs.existsSync(targetPath)) {
            console.log(chalk.red(`⚠️ The controller ${chalk.bold(filename)} already exists in the target directory.`));
            return null;
        }
        const content = buildHandlebarsTemplate('generator/controller', {
            className: className,
            kebabCaseName: kebabCaseName,
            serviceCamelCaseName: withService ? `${toCamelCase(name)}Service` : null,
            serviceClassName: withService ? `${pascalCase}Service` : null,
        });
        await fs.outputFile(targetPath, content);
        console.log(chalk.green(`✅ Controller generated at: ${targetPath}`));
        return targetPath;
    }
    catch (e) {
        console.error(chalk.red('Error generating controller:', e));
        return null;
    }
}
//# sourceMappingURL=generate.js.map