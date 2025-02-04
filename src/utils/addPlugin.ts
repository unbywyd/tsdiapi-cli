import inquirer from 'inquirer'
import chalk from 'chalk'
import { setupCron, setupPrisma, setupSockets, setupEvents, setupS3, setupJWTAuth, setupInforu, setupEmail, buildHandlebarsTemplate } from '../utils'
import { RegisteredPlugins, PluginName, AvailablePlugins, getPackageName, IsDev } from '../config'
import { Project, SyntaxKind } from 'ts-morph'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { exec } from 'child_process'
import { findNearestPackageJson } from './cwd'
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
  try {
    const currentDirectory = await findTSDIAPIServerProject()

    if (!currentDirectory) {
      return console.log(
        chalk.red(`Not found package.json or maybe you are not using @tsdiapi/server!`)
      )
    }

    let selectedPluginName = pluginName;
    const appFilePath = path.resolve(`${currentDirectory}/src`, 'main.ts');


    if (pluginName && !AvailablePlugins.includes(pluginName as PluginName)) {
      return console.log(chalk.red(`Plugin ${pluginName} is not available.`))
    }
    if (!pluginName) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPlugin',
          message: 'Select a plugin to install:',
          choices: AvailablePlugins,
        },
      ]);
      selectedPluginName = answer.selectedPlugin
    }

    const packageName = getPackageName(selectedPluginName as PluginName);
    const isInstalled = isPackageInstalled(currentDirectory, packageName);
    if (isInstalled) {
      return console.log(chalk.red(`Plugin ${packageName} already installed!`))
    }

    await addPluginToApp(appFilePath, selectedPluginName + 'Plugin', packageName, currentDirectory);

    try {
      switch (selectedPluginName) {
        case 'prisma':
          await setupPrisma(currentDirectory);
          break
        case 'socket.io':
          await setupSockets(currentDirectory);
          break
        case 'cron':
          await setupCron(currentDirectory);
          break
        case 'events':
          await setupEvents(currentDirectory);
          break
        case 's3':
          await setupS3(currentDirectory);
          break
        case 'jwt-auth':
          await setupJWTAuth(currentDirectory);
          break
        case 'inforu':
          await setupInforu(currentDirectory);
          break
        case 'email':
          await setupEmail(currentDirectory);
          break
        default:
          console.log(chalk.red(`No setup logic defined for plugin: ${selectedPluginName}`));
          return
      }
    } catch (error) {
      console.error(`Error adding plugin ${selectedPluginName}: ${error.message}`)
    }
    console.log(chalk.green(`Plugin ${selectedPluginName} successfully installed.`))
  } catch (e) {
    console.error(chalk.red("An unexpected error occurred: ", e.message));
    process.exit(1);
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
            console.log(chalk.yellow(`Plugin ${pluginName} already added to the app.`))
            return false
          }

          pluginsArray.addElement(`${pluginName}()`)
        } else {
          console.log(chalk.red('Error adding plugin to app.'))
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
    if (!IsDev) {
      await execAsync(`npm install ${pluginName}`, {
        cwd: projectDir,
      })
    } else {
      console.log(chalk.yellow(`Skipping npm install in dev mode.`))
    }
  } else {
    console.error('createApp function not found.')
    return false
  }

  sourceFile.saveSync()
  return true
}

/**
 * Finds the root directory of the nearest project containing "@tsdiapi/server" in its dependencies.
 *
 * @returns The root directory path of the TSDIAPI-Server project or null if not found.
 */
export async function findTSDIAPIServerProject(cwd?: string): Promise<string | null> {
  try {
    const packageJsonPath = findNearestPackageJson(cwd);
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
    if (dependencies && dependencies['@tsdiapi/server']) {
      return path.dirname(packageJsonPath)
    }
    return null;
  } catch (error) {
    console.error('Error while searching for TSDIAPI-Server project:', error.message)
    return null
  }
}


export function isPackageInstalled(projectPath: string, packageName: string): boolean {
  try {
    const packageJsonPath = path.resolve(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.error(`package.json not found in the directory: ${projectPath}`);
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const peerDependencies = packageJson.peerDependencies || {};

    return Boolean(
      dependencies[packageName] ||
      devDependencies[packageName] ||
      peerDependencies[packageName]
    );
  } catch (error) {
    console.error(`Error checking package.json: ${error.message}`);
    return false;
  }
}