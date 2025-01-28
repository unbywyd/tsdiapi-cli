import inquirer from 'inquirer'
import chalk from 'chalk'
import { setupCron, setupPrisma, setupSockets, setupEvents, setupS3 } from '../utils'
import { AvailablePlugins } from '../config'
import { Project, SyntaxKind } from 'ts-morph'
import fs from 'fs'
import { findUp } from 'find-up'
import path from 'path'
import util from 'util'
import { exec } from 'child_process'
const execAsync = util.promisify(exec)

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
  const currentDirectory = await findTSDIAPIServerProject()

  if (!currentDirectory) {
    return console.log(
      chalk.red(`Not found package.json or maybe you are not using tsdiapi-server!`)
    )
  }

  const appFilePath = path.resolve(`${currentDirectory}/src`, 'main.ts')

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
        if (await addPluginToApp(appFilePath, selectedPlugin, 'tsdiapi-prisma', currentDirectory))
          await setupPrisma(currentDirectory)
        else return console.log(chalk.red(`Plugin: ${selectedPlugin} already added!`))
        break

      case 'socket.io':
        if (await addPluginToApp(appFilePath, selectedPlugin, 'tsdiapi-io', currentDirectory))
          await setupSockets(currentDirectory)
        else return console.log(chalk.red(`Plugin: ${selectedPlugin} already added!`))
        break

      case 'cron':
        if (await addPluginToApp(appFilePath, selectedPlugin, 'tsdiapi-cron', currentDirectory))
          await setupCron(currentDirectory)
        else return console.log(chalk.red(`Plugin: ${selectedPlugin} already added!`))
        break

      case 'events':
        if (await addPluginToApp(appFilePath, selectedPlugin, 'tsdiapi-events', currentDirectory))
          await setupEvents(currentDirectory)
        else return console.log(chalk.red(`Plugin: ${selectedPlugin} already added!`))
        break

      case 's3':
        if (await addPluginToApp(appFilePath, selectedPlugin, 'tsdiapi-s3', currentDirectory))
          await setupS3(currentDirectory)
        else return console.log(chalk.red(`Plugin: ${selectedPlugin} already added!`))
        break

      default:
        console.log(chalk.red(`No setup logic defined for plugin: ${selectedPlugin}`))
        return
    }

    console.log(chalk.green(`Plugin ${selectedPlugin} successfully installed.`))
  }
}

async function addPluginToApp(
  filePath: string,
  pluginName: string,
  pluginImportPath: string,
  projectDir: string
): Promise<boolean> {
  const project = new Project()
  const sourceFile = project.addSourceFileAtPath(filePath)

  const existingImport = sourceFile.getImportDeclaration(
    (imp) => imp.getModuleSpecifier().getLiteralValue() === pluginImportPath
  )

  if (existingImport) {
    return false
  }

  sourceFile.addImportDeclaration({
    defaultImport: pluginName,
    moduleSpecifier: pluginImportPath,
  })

  const createAppCall = sourceFile
    .getFirstDescendantByKind(SyntaxKind.CallExpression)
    ?.getFirstChildByKind(SyntaxKind.Identifier)
  if (createAppCall?.getText() === 'createApp') {
    const createAppExpression = createAppCall.getParentIfKind(SyntaxKind.CallExpression)
    const argument = createAppExpression?.getArguments()[0]

    if (argument?.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const argumentObject = argument.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      const pluginsProperty = argumentObject.getProperty('plugins')

      if (pluginsProperty) {
        const pluginsArray = pluginsProperty.getFirstChildByKind(SyntaxKind.ArrayLiteralExpression)

        if (pluginsArray) {
          const pluginAlreadyAdded = pluginsArray.getText().includes(pluginName)
          if (pluginAlreadyAdded) {
            console.log(`Plugin "${pluginName}" is already added to plugins.`)
            return false
          }

          pluginsArray.addElement(`${pluginName}()`)
        } else {
          console.log('The "plugins" property exists but is not an array.')
        }
      } else {
        argumentObject.addPropertyAssignment({
          name: 'plugins',
          initializer: `[${pluginName}()]`,
        })
      }
    } else {
      createAppExpression?.addArgument(`{ plugins: [${pluginName}()] }`)
    }
    await execAsync(`npm install ${pluginName}`, {
      cwd: projectDir,
    })
  } else {
    console.error('createApp function not found.')
    return false
  }

  sourceFile.saveSync()
  return true
}

/**
 * Finds the root directory of the nearest project containing "tsdiapi-server" in its dependencies.
 *
 * @returns The root directory path of the TSDIAPI-Server project or null if not found.
 */
export async function findTSDIAPIServerProject(): Promise<string | null> {
  try {
    const packageJsonPath = await findUp('package.json')
    if (!packageJsonPath) {
      return null
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
      ...packageJson.optionalDependencies,
    }
    if (dependencies && dependencies['tsdiapi-server']) {
      return path.dirname(packageJsonPath)
    }
    const parentDir = path.dirname(path.dirname(packageJsonPath))
    process.chdir(parentDir)
    return await findTSDIAPIServerProject()
  } catch (error) {
    console.error('Error while searching for TSDIAPI-Server project:', error.message)
    return null
  }
}
