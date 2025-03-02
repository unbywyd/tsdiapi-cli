import { getPackageName } from './../config';
import inquirer, { Question } from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { glob } from "glob";
import { applyTransform, convertWhenToFunction, validateInput } from './inquirer';
import { PluginConfigVariable, PluginFileMapping, PluginFileModification, PluginMetadata } from './plugins-configuration';
import { findTSDIAPIServerProject, getPluginMetadata, getPluginMetaDataFromRoot, isPackageInstalled } from './plugins';
import { findNearestPackageJson, isDirectoryPath, isValidRequiredPath, replacePlaceholdersInPath } from './cwd';
import { updateAllEnvFilesWithVariable } from './env';
import { addAppConfigParams } from './app.config';
import { fileModifications } from './modifications';
import { toCamelCase, toKebabCase, toPascalCase } from './format';
import Handlebars from './handlebars';


function generateInquirerQuestion(variable: PluginConfigVariable) {
    return {
        ...variable.inquirer,
        type: variable.inquirer?.type || (variable.type === "boolean" ? "confirm" : "input"),
        name: variable.name,
        message: variable.inquirer?.message || variable.description || variable.name,
        default: variable.inquirer?.default || variable.default || "",
        validate: variable.validate ? validateInput(variable.validate) : undefined,
        filter: variable.transform ? applyTransform(variable.transform) : undefined,
        when: convertWhenToFunction(variable.when)
    }
}

export async function toSetupPlugin(pluginName: string): Promise<void> {
    try {
        const currentDirectory = await findTSDIAPIServerProject();
        let isLocalPath = false;
        if (!currentDirectory) {
            return console.log(
                chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`)
            )
        }
        const packageName = getPackageName(pluginName);
        const isInstalled = isPackageInstalled(currentDirectory, packageName);
        if (!isInstalled) {
            const findByPath = path.join(process.cwd(), pluginName, 'tsdiapi.config.json');
            const isInstalled = fs.existsSync(findByPath);
            if (!isInstalled) {
                console.log(chalk.yellow(`Plugin ${packageName} is not installed. Skipping setup.`));
                return;
            } else {
                isLocalPath = true;
            }
        }

        const config = isLocalPath ? await getPluginMetaDataFromRoot(path.join(process.cwd(), pluginName)) : await getPluginMetadata(currentDirectory, packageName);
        if (!config) {
            console.log(chalk.yellow(`No setup logic defined for plugin: ${packageName}`));
            console.log(chalk.green(`${packageName} setup has been successfully completed.`));
        } else {
            console.log(chalk.blue(`Loaded configuration for ${packageName}`));
            await setupCommon(packageName, currentDirectory, config);
        }
    } catch (e) {
        console.error(chalk.red(`Error while setting up plugin: ${pluginName}: ${e.message}`));
    }
}


export async function setupCommon(pluginName: string, projectDir: string, pluginConfig: PluginMetadata): Promise<Record<string, any> | false> {
    try {
        if (pluginConfig?.preMessages?.length) {
            for (const message of pluginConfig.preMessages) {
                try {
                    const template = Handlebars.compile(message);
                    console.log(chalk.green(`- ${template({ pluginName, name: pluginName })}`));
                } catch (e) {
                    console.error(chalk.red(`Error while rendering pre message: ${e.message}`));
                }
            }
        }
        const {nextAccept} = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'nextAccept',
                message: `${chalk.cyan(`${chalk.bgBlue('Do you want')} to continue with the setup of ${pluginName}?`)}`,
                default: true,
            },
        ]);
        if (!nextAccept) {
            console.log(chalk.yellow(`Setup of ${pluginName} has been skipped.`));
            return false;
        }
        if (pluginConfig.requiredPackages?.length) {
            console.log(chalk.blue(`Checking required packages for plugin ${pluginName}...`));
            for (const packageName of pluginConfig.requiredPackages) {
                const isInstalled = await isPackageInstalled(projectDir, packageName);
                if (!isInstalled) {
                    console.log(
                        chalk.red(`Plugin ${packageName} is required for ${pluginName} but not installed!`)
                    );
                    if (packageName?.startsWith('@tsdiapi')) {
                        console.log(
                            chalk.red(`Please install the required plugin by running: tsdiapi plugins add ${packageName}`)
                        );
                    } else {
                        console.log(
                            chalk.red(`Please install the required package by running: npm install ${packageName}`)
                        );
                    }

                    return false;
                } else {
                    console.log(chalk.green(`✅ Required plugin ${packageName} is present in the project!`));
                }
            }
        }

        if (pluginConfig?.requiredPaths?.length) {
            console.log(chalk.blue(`Checking required paths for plugin ${pluginName}...`));
            for (const requiredPath of pluginConfig.requiredPaths) {
                if (!isValidRequiredPath(requiredPath)) {
                    console.log(
                        chalk.red(`Invalid required path: ${requiredPath}!`)
                    );
                    console.log(
                        chalk.red(`Invalid required path: ${requiredPath}! Path should be relative to the root of the project and point to a specific file. Please check your plugin configuration.`)
                    );
                    return false;
                }
                const fullPath = path.join(projectDir, requiredPath);
                if (!fs.existsSync(fullPath)) {
                    console.log(
                        chalk.bgYellow.white.bold(" ⚠️ DENIED ") +
                        chalk.red(` Required path not found: ${requiredPath}!`)
                    );
                    console.log(
                        chalk.red(`The required file is necessary for the installation of this plugin. Please ensure it is present in the project.`)
                    );
                    return false;
                }
            }
        }

        let handlebarsPayload = {
            name: pluginConfig.name,
            description: pluginConfig.description,
            pluginName,
        }

        const varNames = pluginConfig.variables?.map((v) => v.name);

        if (!varNames?.length) {
            console.log(chalk.yellow(`No settings found for ${pluginName}. Skipping setup.`));
        } else {
            const { setupCommon } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'setupCommon',
                    message: `${chalk.cyan(`${chalk.bgBlue('Do you want')} to configure ${pluginName} settings?`)}`,
                    default: true,
                },
            ]);

            if (!setupCommon) {
                console.log(chalk.yellow(`Setup of ${pluginName} settings has been skipped.`));
            } else {
                const vars = pluginConfig.variables || [];
                if (!vars.length) {
                    console.log(chalk.yellow(`No settings found for ${pluginName}. Skipping setup.`));
                } else {
                    const questions: Question[] = vars
                        .filter((v) => v.inquirer && v.configurable)
                        .map(generateInquirerQuestion);

                    const envAnswers = await inquirer.prompt(questions as any);
                    for (const envKey in envAnswers) {
                        const v = vars.find(v => v.name === envKey);
                        if (v?.alias) {
                            envAnswers[v.alias] = envAnswers[envKey];
                        }
                    }
                    handlebarsPayload = { ...handlebarsPayload, ...envAnswers };
                    vars.forEach((variable: PluginConfigVariable) => {
                        const value = envAnswers[variable.name] ?? variable.default;
                        updateAllEnvFilesWithVariable(projectDir, variable.name, value);
                    });

                    console.log(chalk.green('.env file has been successfully updated with settings.'));
                    const configParams = vars.map((v) => {
                        return { key: v.name, type: v.type }
                    });
                    await addAppConfigParams(projectDir, configParams);
                }
            }
        }

        if (pluginConfig.provideScripts) {
            try {
                const packageJsonPath = findNearestPackageJson(projectDir);
                if (packageJsonPath) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                    const updatedPackageJson = await addScriptsToPackageJson(packageJson, pluginConfig.provideScripts);
                    fs.writeFileSync(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
                }
            } catch (e) {
                console.error(chalk.red(`Error while adding scripts to package.json: ${e.message}`));
            }
        }

        const name = pluginConfig.name || pluginName;
        const pascalCaseName = toPascalCase(name);
        const payload = {
            ...handlebarsPayload,
            pluginName: name,
            className: pascalCaseName,
            classname: pascalCaseName,
            packageName: pluginName,
        }

        const packagePath = path.resolve(projectDir, 'node_modules', pluginName);

        if (pluginConfig.files && pluginConfig.files.length) {
            await copyPluginFiles(packagePath, projectDir, pluginConfig.files, payload);
        }

        if (pluginConfig?.postFileModifications?.length) {
            await fileModifications(pluginName, projectDir, pluginConfig.postFileModifications, payload);
        }

        console.log(chalk.green(`${pluginName} setup has been successfully completed.`));
        if (pluginConfig.postMessages && pluginConfig.postMessages.length) {
            for (const message of pluginConfig.postMessages) {
                try {
                    const template = Handlebars.compile(message);
                    console.log(chalk.green(`- ${template(handlebarsPayload)}`));
                } catch (e) {
                    console.error(chalk.red(`Error while rendering post message: ${e.message}`));
                }
            }
        }

        return payload;
    } catch (error) {
        console.error(chalk.red(`Error while setting up ${pluginName} settings: ${error.message}`));
        return false;
    }
}

export async function addScriptsToPackageJson(
    packageJson: Record<string, any>,
    provideScripts: Record<string, string>
): Promise<Record<string, any>> {
    if (!packageJson.scripts) {
        packageJson.scripts = {};
    }
    const toAddScripts: Array<{ scriptName: string; command: string }> = [];
    for (const [scriptName, command] of Object.entries(provideScripts)) {
        if (!packageJson.scripts[scriptName]) {
            toAddScripts.push({ scriptName, command });
        } else {
            console.log(chalk.yellow(`⚠️ Script "${scriptName}" already exists in the package.json.`));
        }
    }
    if (toAddScripts.length) {
        console.log(chalk.yellow('The following scripts will be added to your package.json:'));
        for (const { scriptName, command } of toAddScripts) {
            console.log(`${chalk.green('🟡 (new)')} ${chalk.white(scriptName)}: ${chalk.white(command)}`);
        }
        console.log('\n');
        const { accepted } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'accepted',
                message: chalk.cyan(`${chalk.blue("Do you want")} to add these scripts to your package.json?`),
                default: true,
            },
        ]);
        if (!accepted) {
            console.log(chalk.yellow('❌ Scripts were not added to the package.json.'));
            return packageJson;
        }
        for (const { scriptName, command } of toAddScripts) {
            packageJson.scripts[scriptName] = command;
            console.log(chalk.green(`✅ Script "${scriptName}" has been added to the package.json.`));
        }
    }


    return packageJson;
}

export async function copyPluginFiles(packagePath: string, projectDir: string, mappings: PluginFileMapping[], payload: Record<string, any>): Promise<void> {
    try {
        const filesToCopy: Array<{
            sourceFile: string;
            targetPath: string;
            overwrite: boolean;
            isExisting: boolean;
            isHandlebarsTemplate: boolean;
        }> = [];
        for (const { source, destination, overwrite = false, isHandlebarsTemplate } of mappings) {
            const resolvedDest = path.resolve(projectDir, destination);
            const files = glob.sync(source, { cwd: packagePath });

            if (files.length === 0) {
                continue;
            }

            for (const file of files) {
                let sourceFile = path.resolve(packagePath, file);
                const fileName = path.basename(file);

                let targetPath = isDirectoryPath(resolvedDest) ? path.join(resolvedDest, fileName) : resolvedDest;
                targetPath = replacePlaceholdersInPath(targetPath, payload, payload.kebabcase);
                const isExisting: boolean = fs.existsSync(targetPath);
                if (!overwrite && isExisting) {
                    console.log(chalk.yellow(`⚠️ Skipping: File already exists: ${targetPath}`));
                    continue;
                }
                filesToCopy.push({ sourceFile, isHandlebarsTemplate: isHandlebarsTemplate ? true : false, targetPath, overwrite, isExisting });
            }
        }

        if (filesToCopy.length) {
            console.log(chalk.yellow('The following files will be added/updated in your project:'));
            for (const { targetPath, isExisting } of filesToCopy) {
                if (isExisting) {
                    console.log(`${chalk.yellow('⚠️ (replace)')} ${chalk.white(targetPath)}`);
                } else {
                    console.log(`${chalk.green('🟡 (new)')} ${chalk.white(targetPath)}`);
                }
            }
            console.log('\n');
            const { accepted } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'accepted',
                    message: chalk.cyan(`${chalk.blue("Do you want")} to add these files to your project?`),
                    default: true,
                },
            ]);

            if (!accepted) {
                console.log(chalk.yellow('❌ Files were not added to the project.'));
                return;
            }

            for (const { sourceFile, targetPath, isHandlebarsTemplate, overwrite } of filesToCopy) {
                fs.ensureDirSync(path.dirname(targetPath));

                if (!isHandlebarsTemplate) {
                    fs.copySync(sourceFile, targetPath, { overwrite });
                } else {
                    try {
                        const template = Handlebars.compile(fs.readFileSync(sourceFile, 'utf-8'));
                        fs.writeFileSync(targetPath, template(payload));
                    } catch (e) {
                        console.error(chalk.red(`Error while rendering handlebars template: ${e.message}`));
                    }
                }

                console.log(chalk.green(`✅ File "${targetPath}" has been added to the project.`));
            }
        }

    } catch (error) {
        console.error(`❌ Error copying plugin files: ${error.message}`);
    }
}