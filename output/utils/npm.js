import chalk from 'chalk';
import { spawn, exec } from 'child_process';
import util from 'util';
import path from 'path';
import ora from "ora";
import fetch from 'node-fetch';
import fs from "fs";
import { findNearestPackageJson } from './cwd.js';
const execAsync = util.promisify(exec);
export function runUnsafeNpmScript(projectDir, scriptName) {
    console.log(chalk.blue(`💡 Command: ${chalk.cyan(`npm run ${scriptName}`)}`));
    const npmProcess = spawn("npm", ["run", scriptName], {
        cwd: projectDir,
        stdio: "inherit",
        shell: true,
    });
    npmProcess.on("close", (code) => {
        if (code === 0) {
            console.log(chalk.green(`✅ "${scriptName}" script completed successfully.`));
        }
        else {
            console.log(chalk.red(`❌ "${scriptName}" script failed with code ${code}.`));
        }
        process.exit(code || 1);
    });
}
export async function runPostInstall(pluginName, cwd, postInstallCommand) {
    try {
        const { stdout, stderr } = await execAsync(postInstallCommand, { cwd });
        if (stdout)
            console.log(chalk.green(`✅ Output:\n${stdout}`));
        if (stderr)
            console.log(chalk.red(`⚠️ Errors:\n${stderr}`));
    }
    catch (error) {
        console.log(chalk.red(`❌ Failed to execute post-install script:`));
        console.error(chalk.red(`💥 Error: ${error.message}`));
    }
}
export function runNpmScript(scriptName) {
    console.log(chalk.blue(`💡 Command: ${chalk.cyan(`npm run ${scriptName}`)}`));
    try {
        const packageJsonPath = findNearestPackageJson();
        if (!packageJsonPath) {
            console.error(chalk.red("❌ No package.json found in the current directory or its parents."));
            process.exit(1);
        }
        const projectDir = path.dirname(packageJsonPath);
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (!pkg.scripts || !pkg.scripts[scriptName]) {
            console.error(chalk.red(`❌ The script "${scriptName}" is not defined in package.json.`));
            process.exit(1);
        }
        const npmProcess = spawn("npm", ["run", scriptName], {
            cwd: projectDir,
            stdio: "inherit",
            shell: true,
        });
        npmProcess.on("close", (code) => {
            if (code === 0) {
                console.log(chalk.green(`✅ "${scriptName}" script completed successfully.`));
            }
            else {
                console.log(chalk.red(`❌ "${scriptName}" script failed with code ${code}.`));
            }
        });
    }
    catch (error) {
        console.log(chalk.red(`❌ "${scriptName}" script failed with code ${error}.`));
        console.error(chalk.red("❌ An error occurred while running the script:"), error.message);
    }
}
/**
 * Run `npm install` in the specified directory.
 * @param projectDir The directory where the command should be executed.
 */
export async function runNpmInstall(projectDir) {
    console.log(chalk.blue(`Installing dependencies in ${projectDir}...`));
    return new Promise((resolve, reject) => {
        const npmProcess = spawn("npm", ["install", "--omit=optional"], {
            cwd: projectDir,
            stdio: "inherit",
            shell: true,
        });
        npmProcess.on("close", (code) => {
            if (code === 0) {
                console.log(chalk.green("✅ Dependencies installed successfully!"));
                resolve();
            }
            else {
                console.log(chalk.red(`❌ npm install failed with exit code ${code}.`));
                reject(new Error(`Failed to install dependencies. Exit code: ${code}`));
            }
        });
        npmProcess.on("error", (error) => {
            console.log(chalk.red(`❌ npm install encountered an error: ${error.message}`));
            reject(error);
        });
    });
}
export async function installBaseDependencies(projectDir) {
    console.log(chalk.blue("\n📦 Installing base dependencies...\n"));
    const baseDependencies = [
        "axios",
        "@tsdiapi/server",
        "reflect-metadata",
        "class-transformer",
        "class-validator",
        "routing-controllers",
        "routing-controllers-openapi",
        "typedi",
        "cross-env"
    ];
    const devDependencies = [
        "@types/node",
        "cpy-cli",
        "prisma-class-dto-generator",
        "tsc-alias",
        "nodemon",
        "ts-node",
        "tslib",
        "typescript",
        "@types/express"
    ];
    const spinner = ora({
        text: chalk.yellow("⏳ Installing dependencies..."),
        spinner: "dots"
    }).start();
    try {
        await execAsync(`npm install ${baseDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk.green("✅ Base dependencies installed!"));
        spinner.text = chalk.yellow("🔧 Installing dev dependencies...");
        spinner.start();
        await execAsync(`npm install -D ${devDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk.green("✅ Dev dependencies installed!"));
    }
    catch (error) {
        spinner.fail(chalk.red("❌ Installation failed!"));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
export async function packageExistsOnNpm(packageName, silent) {
    const spinner = silent
        ? null
        : ora({
            text: chalk.blue(`🔍 Checking NPM for package: ${chalk.bold(packageName)}...`),
            color: "cyan",
        }).start();
    try {
        const response = await fetch(`https://registry.npmjs.org/${packageName}`);
        if (response.ok) {
            spinner?.succeed(chalk.green(`✅ Package ${chalk.bold(packageName)} is available on NPM.`));
            return true;
        }
        else {
            spinner?.fail(chalk.red(`❌ Package ${chalk.bold(packageName)} does not exist on NPM.`));
            return false;
        }
    }
    catch (error) {
        spinner?.fail(chalk.red(`❌ Failed to check package: ${error.message}`));
        return false;
    }
}
//# sourceMappingURL=npm.js.map