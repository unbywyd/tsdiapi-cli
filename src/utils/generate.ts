import { getPackageName } from './../config';
import chalk from "chalk"
import { findTSDIAPIServerProject, getPluginMetadata, isPackageInstalled } from "./plugins"
import inquirer from "inquirer";
import fs from "fs-extra";
import { toCamelCase, toKebabCase, toPascalCase } from "./format";
import path from "path";
import { applyTransform, convertWhenToFunction, validateInput } from './inquirer';
import { glob } from "glob";
import { PluginGenerator } from './plugins-configuration';
import { buildHandlebarsTemplate, buildHandlebarsTemplateWithPath } from './hbs';
import { isDirectoryPath, resolveTargetDirectory } from './cwd';


export async function generate(pluginName: string, generatorName?: string, _args?: Record<string, any>): Promise<void> {
    try {
        const args: Record<string, any> = _args || {};
        if (args.name) {
            const validName = /^(?!.*\.\.)([a-zA-Z0-9-_\/]+)$/;
            if (!validName.test(args.name)) {
                return console.log(
                    chalk.red(`Invalid name: ${args.name}! Name must be a valid directory path containing only letters, numbers, hyphens, underscores, and slashes.`)
                )
            }
        }
        if (pluginName === 'feature') {
            if (!generatorName) {
                console.log(chalk.bgRed.white.bold("⚠️ ERROR ") +
                    chalk.red(` Feature name is required!\n\n`) +
                    chalk.yellow(`Usage: tsdiapi generate feature <name>\n`) +
                    chalk.cyan(`Example: tsdiapi generate feature user`));
                process.exit(1);
            }
            return generateFeature(generatorName!);
        }

        // Local generators
        if (pluginName === 'controller' || pluginName === 'service') {
            if (!generatorName) {
                console.log(chalk.bgRed.white.bold("⚠️ ERROR ") +
                    chalk.red(` Generator name is required!\n\n`) +
                    chalk.yellow(`Usage: tsdiapi generate ${pluginName} <name>\n`) +
                    chalk.cyan(`Example: tsdiapi generate ${pluginName} user`));
                process.exit(1);
            }
            return safeGenerate(pluginName, generatorName, args);
        }

        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(
                chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`)
            )
        }


        const packageName = getPackageName(pluginName);

        const isInstalled = await isPackageInstalled(currentDirectory, packageName);
        if (!isInstalled) {
            return console.log(
                chalk.red(`Plugin ${pluginName} is not installed!`)
            )
        }

        const config = await getPluginMetadata(currentDirectory, packageName);
        const generators = config?.generators || [];
        if (!generators.length) {
            return console.log(
                chalk.red(`Plugin ${pluginName} does not have any generators!`)
            )
        }

        const generatorByName = generatorName ? generators.find((g) => g.name === generatorName) : null;

        if (generatorName && !generatorByName) {
            if (generators?.length > 1) {
                return console.log(
                    chalk.red(`Generator ${generatorName} not found in plugin ${pluginName}!`)
                )
            } else {
                // Мы не нашли генератор, но у нас всего один генератор, поэтому используем его уведомим пользователя о том, что мы взяли его
                const selectedGeneratorName = generators[0].name;
                console.log(chalk.yellow(`Generator ${generatorName} not found in plugin ${pluginName}! Using ${selectedGeneratorName} instead.`));
            }
        }

        let currentGenerator: PluginGenerator = generatorByName || generators[0];
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

                currentGenerator = generators.find(g => g.name === answer.generator) as PluginGenerator;
            } catch (e) {
                console.log(chalk.red('Operation canceled!'))
                return;
            }
        }
        if (!currentGenerator) {
            return console.log(
                chalk.red(`Generator ${generatorName} not found in plugin ${pluginName}!`)
            )
        }

        if (currentGenerator.description) {
            console.log(chalk.green(`Selected generator: ${currentGenerator.name} - ${currentGenerator.description}`));
        } else {
            console.log(chalk.green(`Selected generator: ${currentGenerator.name}`));
        }
        let defaultObj: Record<string, any> = args || {};

        const plugArgs = currentGenerator?.args || [];
        const plugFiles = currentGenerator?.files || [];
        if (!plugFiles.length) {
            return console.log(
                chalk.red(`Generator ${currentGenerator.name} does not have any files!`)
            )
        }

        const isConfigurable = plugArgs.length > 0;
        const nameIsUndefined = !defaultObj.name;
        if (isConfigurable || nameIsUndefined) {
            const questions: Array<Record<string, any>> = plugArgs.filter(a => a.inquirer && a.name !== 'name').map((arg) => {
                const defaultValue = args?.[arg.name] || arg.inquirer?.default || "";
                return {
                    ...arg.inquirer,
                    name: arg.name,
                    default: defaultValue,
                    message: arg?.inquirer?.message || arg.description || '',
                    validate: arg.validate ? validateInput(arg.validate) : undefined,
                    filter: arg.transform ? applyTransform(arg.transform) : undefined,
                    when: convertWhenToFunction(arg.when)
                }
            });
            if (nameIsUndefined) {
                questions.unshift({
                    type: 'input',
                    name: 'name',
                    message: 'Enter the name:',
                    validate: (value: string) => {
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
                    defaultObj = await inquirer.prompt(questions as any);
                } catch (e) {
                    console.log(chalk.red('Operation canceled!'))
                    return;
                }
            }
        }
        if (!defaultObj.name) {
            console.log(chalk.red('Name is required!'))
            return;
        }

        const name = defaultObj.name;
        const baseName = path.basename(name);
        const camelCaseName = toCamelCase(baseName);
        const pascalCaseName = toPascalCase(baseName);
        const kebabCaseName = toKebabCase(baseName);

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
        }

        const filesToGenerate = [];

        try {
            const cwd = resolveTargetDirectory(process.cwd(), name);
            const packagePath = path.join(currentDirectory, 'node_modules', packageName);

            for (const { source, destination, overwrite = false, isHandlebarsTemplate } of plugFiles) {
                const resolvedDest = path.resolve(cwd, destination);
                const files = glob.sync(source, { cwd: packagePath });
                if (files.length === 0) {
                    continue;
                }

                for (const file of files) {
                    const sourceFile = path.resolve(packagePath, file);
                    const fileName = path.basename(file);


                    const targetPath = isDirectoryPath(resolvedDest) ? path.join(resolvedDest, fileName) : resolvedDest;
                    const outputPath = replacePlaceholdersInPath(targetPath, defaultObj, name);

                    if (fs.existsSync(outputPath)) {
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
                console.log(chalk.red(`❌ No files found to generate!`));
                return;
            }

            console.log(chalk.blue(`\n🔹 The following files will be generated:\n`));

            for (const { outputPath } of filesToGenerate) {
                console.log(`${chalk.green('🟡 (new)')} ${chalk.white(outputPath)}`);
            }

            console.log('\n');

            const { accepted } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'accepted',
                    message: `Do you want to generate ${filesToGenerate.length} files?`,
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
                } else {
                    fs.copySync(sourceFile, outputPath, { overwrite: overwrite });
                }
                console.log(chalk.green(`✅ Created: ${outputPath}`));
            }

            console.log(chalk.green(`\n🎉 ${plugFiles.length} files have been successfully generated!\n`));
        } catch (error) {
            console.error(`❌ ${currentGenerator.name} generator error: ${error.message}`);
        }
    } catch (e) {
        console.error(chalk.red('Error generating plugin:', e));
    }
}

export function replacePlaceholdersInPath(
    filePath: string,
    replacements: Record<string, string>,
    defaultName: string
): string {
    const dir = path.dirname(filePath);
    let ext = path.extname(filePath);
    let fileName = path.basename(filePath, ext);

    fileName = fileName.replace(/\[([^\]]+)\]/g, (_, key) => replacements[key] || "");

    if (!/[a-zA-Z0-9]/.test(fileName)) {
        fileName = defaultName;
    }

    return path.join(dir, `${fileName}${ext}`);
}

export async function generateFeature(name: string, projectDir?: string) {
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
                    message: `🛠️ Do you want to generate a new feature named ${chalk.bold(name)}?`,
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

    } catch (e) {
        console.error(chalk.bgRed.white.bold(" ❌ ERROR ") +
            chalk.red(` An error occurred while generating the feature:\n${e.message}\n`));
    }
}



export async function safeGenerate(pluginName: string, generatorName: string, args?: Record<string, any>) {
    const cwd = resolveTargetDirectory(process.cwd(), generatorName);
    const name = path.basename(generatorName);
    try {
        const { accepted } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'accepted',
                message: `Do you want to generate ${chalk.blue.bold(`${name} ${pluginName}`)} in ${cwd}?`,
                default: true,
            },
        ]);

        if (!accepted) {
            console.log(chalk.yellow(`❌ Operation cancelled by the user.`));
            return;
        }

        if (pluginName === 'controller') {
            await generateNewController(name, cwd, args?.service || false);

        } else if (pluginName === 'service') {
            await generateNewService(name, cwd);
        }
    } catch (e) {
        console.error(chalk.red('Error generating plugin:', e));
    }
}

export async function generateNewService(name: string, dir: string): Promise<string | null> {
    try {
        const pascalCase = toPascalCase(name);
        const kebabCaseName = toKebabCase(name);
        const filename = `${kebabCaseName}.service.ts`;
        const className = `${pascalCase}Service`;

        const targetPath = path.join(dir, filename);
        if (fs.existsSync(targetPath)) {
            console.log(
                chalk.red(`⚠️ The service ${chalk.bold(filename)} already exists in the target directory.`)
            );
            return null;
        }
        const content = buildHandlebarsTemplate('generator/service', {
            className: className,
        });
        await fs.outputFile(targetPath, content);
        console.log(chalk.green(`✅ Service generated at: ${targetPath}`));
        return targetPath;
    } catch (e) {
        console.error(chalk.red('Error generating service:', e));
        return null;
    }
}

export async function generateNewController(name: string, dir: string, withService = false) {
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
    } catch (e) {
        console.error(chalk.red('Error generating controller:', e));
        return null;
    }
}

