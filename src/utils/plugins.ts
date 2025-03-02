import chalk from 'chalk'
import { getPackageName } from '../config'
import { Project, SyntaxKind } from 'ts-morph'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { exec } from 'child_process'
import { findNearestPackageJson } from './cwd'
import { setupCommon } from './setup-plugin'
import { nameToImportName } from './format';
import { PluginMetadata, validatePluginConfig } from './plugins-configuration'
import ora from 'ora'
import { packageExistsOnNpm, runPostInstall } from './npm'
import { convertWhenToFunction } from './inquirer'
const execAsync = util.promisify(exec)

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
      } else {
        spinner.warn(chalk.cyan(`Plugin ${packageName} is already installed. Configuring...`));
        await setupCommon(packageName, currentDirectory, config);
      }

      return;
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
      const result = await setupCommon(packageName, currentDirectory, config);
      if (!result) {
        spinner.fail(chalk.red(`❌ Plugin not configured correctly. Please check the logs for more information.`));
        return;
      }
      try {
        if (config.afterInstall && result) {

          const cond = config.afterInstall?.when ? convertWhenToFunction(config.afterInstall.when)(result) : true;
          if (cond) {
            spinner.text = chalk.blue(`⚙️ Running after-install script for ${packageName}...`);
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

export async function getPluginMetaDataFromRoot(packagePath: string) {
  const configPath = path.join(packagePath, 'tsdiapi.config.json');
  if (!fs.existsSync(configPath)) {
    return null;
  } else {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const isValid = await validatePluginConfig(config);
      if (!isValid) {
        return null;
      } else {
        return config;
      }
    } catch (error) {
      console.error(`Error loading plugin configuration: ${error.message}`);
      return null;
    }
  }
}
export async function getPluginMetadata(currentDirectory: string, packageName: string): Promise<PluginMetadata | null> {
  const packagePath = path.join(currentDirectory, 'node_modules', packageName);
  const configPath = path.join(packagePath, 'tsdiapi.config.json');
  if (!fs.existsSync(configPath)) {
    return null;
  } else {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const isValid = await validatePluginConfig(config);
      if (!isValid) {
        return null;
      } else {
        return config;
      }
    } catch (error) {
      console.error(`Error loading plugin configuration: ${error.message}`);
      return null;
    }
  }
}
export async function addPluginToApp(
  filePath: string,
  pluginName: string,
  pluginImportPath: string,
  projectDir: string
): Promise<boolean> {
  const spinner = ora().start();
  try {
    spinner.text = chalk.blue(`📦 Installing ${chalk.bold(pluginImportPath)}...`);
    await execAsync(`npm install ${pluginImportPath}`, { cwd: projectDir });
    spinner.succeed(chalk.green(`✅ Installed ${chalk.bold(pluginImportPath)} successfully!`));

    spinner.text = chalk.blue("🔍 Updating application entry file...");
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Check if import already exists
    const existingImport = sourceFile.getImportDeclaration(
      (imp) => imp.getModuleSpecifier().getLiteralValue() === pluginImportPath
    );

    if (existingImport) {
      spinner.warn(chalk.yellow(`⚠️ Plugin ${pluginName} is already imported. Skipping.`));
      return false;
    }

    // Add import statement
    sourceFile.addImportDeclaration({
      defaultImport: pluginName,
      moduleSpecifier: pluginImportPath,
    });

    // Locate `createApp` function
    const createAppCall = sourceFile
      .getFirstDescendantByKind(SyntaxKind.CallExpression)
      ?.getFirstChildByKind(SyntaxKind.Identifier);

    if (createAppCall?.getText() === "createApp") {
      const createAppExpression = createAppCall.getParentIfKind(SyntaxKind.CallExpression);
      const argument = createAppExpression?.getArguments()[0];

      if (argument?.getKind() === SyntaxKind.ObjectLiteralExpression) {
        const argumentObject = argument.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        const pluginsProperty = argumentObject.getProperty("plugins");

        if (pluginsProperty) {
          const pluginsArray = pluginsProperty.getFirstChildByKind(SyntaxKind.ArrayLiteralExpression);

          if (pluginsArray) {
            if (pluginsArray.getText().includes(pluginName)) {
              spinner.warn(chalk.yellow(`⚠️ Plugin ${pluginName} is already registered. Skipping.`));
              return false;
            }
            pluginsArray.addElement(`${pluginName}()`);
          } else {
            spinner.fail(chalk.red("❌ Failed to locate 'plugins' array in createApp."));
            return false;
          }
        } else {
          argumentObject.addPropertyAssignment({
            name: "plugins",
            initializer: `[${pluginName}()]`,
          });
        }
      } else {
        createAppExpression?.addArgument(`{ plugins: [${pluginName}()] }`);
      }
    } else {
      spinner.fail(chalk.red("❌ Failed to find 'createApp' function in main file."));
      return false;
    }

    sourceFile.saveSync();
    spinner.succeed(chalk.green(`✅ Plugin ${chalk.bold(pluginName)} successfully added to createApp!`));

    return true;
  } catch (error: any) {
    spinner.fail(chalk.red(`❌ Error: ${error.message}`));
    return false;
  }
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
    const nodeModulesPath = path.resolve(projectPath, 'node_modules');
    const pathInNodeModules = path.resolve(nodeModulesPath, packageName);
    if (fs.existsSync(pathInNodeModules)) {
      return true;
    }
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
