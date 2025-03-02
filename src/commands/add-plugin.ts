import chalk from 'chalk'
import { getPackageName } from '../config'
import path from 'path'
import ora from 'ora'
import { packageExistsOnNpm, runPostInstall } from '../utils/npm'
import { nameToImportName } from '../utils/format'
import { setupCommon } from '../utils/setup-plugin'
import { convertWhenToFunction } from '../utils/inquirer'
import { findTSDIAPIServerProject } from '../utils/app-finder'
import { isPackageInstalled } from '../utils/is-plg-installed'
import { addPluginToApp } from '../utils/app-plg-to-app'
import { getPluginMetadata } from '../utils/plg-metadata'

export const addPlugin = async (selectedPluginName: string) => {
    try {
        const spinner = ora().start();

        spinner.text = chalk.blue("🔍 Searching for an existing TSDIAPI project...");
        const currentDirectory = await findTSDIAPIServerProject();

        if (!currentDirectory) {
            spinner.fail(chalk.red("❌ No package.json found or @tsdiapi/server is not detected."));
            return;
        }

        const appFilePath = path.resolve(`${currentDirectory}/src`, "main.ts");

        const packageName = getPackageName(selectedPluginName);

        if (!packageName?.startsWith("@tsdiapi/")) {
            spinner.fail(chalk.red(`❌ Invalid plugin: ${packageName}. Must start with @tsdiapi/`));
            return;
        }

        spinner.text = chalk.blue(`🔎 Checking if ${packageName} exists on npm...`);
        const packageExists = await packageExistsOnNpm(packageName);

        if (!packageExists) {
            spinner.fail(chalk.red(`❌ Package ${packageName} does not exist on npm.`));
            return;
        }

        const isInstalled = isPackageInstalled(currentDirectory, packageName);


        if (!isInstalled) {
            spinner.text = chalk.blue(`📥 Installing ${packageName}...`);
            await addPluginToApp(appFilePath, nameToImportName(selectedPluginName), packageName, currentDirectory);
            spinner.succeed(chalk.green(`✅ Successfully added ${packageName} to the application.`));
        }
        spinner.text = chalk.blue(`🔍 Checking setup configuration for ${packageName}...`);
        const config = await getPluginMetadata(currentDirectory, packageName);

        if (isInstalled) {
            if (!config) {
                spinner.warn(chalk.yellow(`⚠️ Plugin ${packageName} is already installed.`));
                return;
            }
        }

        if (!config) {
            spinner.warn(chalk.yellow(`⚠️ No additional setup required for ${packageName}.`));
            spinner.succeed(chalk.green(`✅ Plugin ${packageName} installed successfully.`));
        } else {
            if (config.postInstall) {
                spinner.text = chalk.blue(`⚙️ Running post-install script for ${packageName}...`);
                console.log(chalk.blue(`⚙️ Running post-install script for ${packageName}...`));

                await runPostInstall(selectedPluginName, currentDirectory, config.postInstall);

                spinner.succeed(chalk.green(`✅ Post-install script executed.`));
            }

            spinner.text = chalk.blue(`🔧 Configuring ${packageName}...`);
            spinner.stop();
            const result = await setupCommon(packageName, currentDirectory, config);
            if (!result) {
                spinner.fail(chalk.red(`❌ Plugin not configured correctly. Please check the logs for more information.`));
                return;
            }
            try {
                if (config.afterInstall && result) {

                    const cond = config.afterInstall?.when ? convertWhenToFunction(config.afterInstall.when)(result) : true;
                    if (cond) {
                        console.log(chalk.blue(`⚙️ Running after-install script for ${packageName}...`));
                        await runPostInstall(selectedPluginName, currentDirectory, config.afterInstall?.command);
                        spinner.succeed(chalk.green(`✅ After-install script executed.`));
                    }
                }
            } catch (error) {
                spinner.fail(chalk.red(`❌ Error running after-setup script: ${error.message}`));
            }
            spinner.succeed(chalk.green(`✅ Configuration for ${packageName} completed.`));
        }

        console.log(chalk.green(`\n🎉 Plugin ${chalk.bold(selectedPluginName)} installed successfully! 🚀\n`));
    } catch (error: any) {
        console.error(chalk.red("❌ An unexpected error occurred: "), error.message);
        process.exit(1);
    }
};