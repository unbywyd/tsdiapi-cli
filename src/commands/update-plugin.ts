import chalk from 'chalk'
import util from 'util'
import { exec } from 'child_process'
import { getPackageName } from '../config.js'
import { findTSDIAPIServerProject } from '../utils/app-finder.js'
import { isPackageInstalled } from '../utils/is-plg-installed.js'
const execAsync = util.promisify(exec)


/**
 * Updates an installed plugin in the current TSDIAPI project.
 *
 * @param {string} pluginName - The name of the plugin to update.
 * @returns {Promise<void>} - A promise that resolves after the plugin is updated.
 */
export const updatePlugin = async (sourceName: string) => {
    const pluginName = getPackageName(sourceName);
    try {
        const currentDirectory = await findTSDIAPIServerProject();
        if (!currentDirectory) {
            return console.log(chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`));
        }


        if (!isPackageInstalled(currentDirectory, pluginName)) {
            return console.log(chalk.red(`Plugin ${pluginName} is not installed.`));
        }

        console.log(chalk.blue(`Updating plugin ${pluginName}...`));
        await execAsync(`npm update ${pluginName}`, { cwd: currentDirectory });

        console.log(chalk.green(`Plugin ${pluginName} successfully updated.`));
    } catch (error) {
        console.error(chalk.red(`Error updating plugin ${pluginName}: ${error.message}`));
    }
};
