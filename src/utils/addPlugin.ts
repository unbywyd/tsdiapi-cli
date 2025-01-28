import inquirer from 'inquirer'
import chalk from 'chalk'
import { setupCron, setupPrisma, setupSockets, setupEvents, setupS3 } from '../utils'
import { AvailablePlugins } from '@src/config'

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
export const addPlugin = async (pluginName?: string) => {
  const currentDirectory = process.cwd()
  if (pluginName) {
    if (AvailablePlugins.includes(pluginName)) {
      console.log(chalk.green(`Installing plugin: ${pluginName}...`))
      switch (pluginName) {
        case 'prisma':
          await setupPrisma(currentDirectory)
          break

        case 'socket.io':
          await setupSockets(currentDirectory)
          break

        case 'cron':
          await setupCron(currentDirectory)
          break

        case 'events':
          await setupEvents(currentDirectory)
          break

        case 's3':
          await setupS3(currentDirectory)
          break

        default:
          console.log(chalk.red(`No setup logic defined for plugin: ${pluginName}`))
          return
      }
      console.log(chalk.green(`Plugin ${pluginName} successfully installed.`))
    } else {
      console.log(chalk.red(`Plugin ${pluginName} is not available.`))
    }
  } else {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPlugin',
        message: 'Select a plugin to install:',
        choices: AvailablePlugins,
      },
    ])

    const selectedPlugin = answer.selectedPlugin
    console.log(chalk.green(`Installing plugin: ${selectedPlugin}...`))

    switch (selectedPlugin) {
      case 'prisma':
        await setupPrisma(currentDirectory)
        break

      case 'socket.io':
        await setupSockets(currentDirectory)
        break

      case 'cron':
        await setupCron(currentDirectory)
        break

      case 'events':
        await setupEvents(currentDirectory)
        break

      case 's3':
        await setupS3(currentDirectory)
        break

      default:
        console.log(chalk.red(`No setup logic defined for plugin: ${pluginName}`))
        return
    }

    console.log(chalk.green(`Plugin ${selectedPlugin} successfully installed.`))
  }
}
