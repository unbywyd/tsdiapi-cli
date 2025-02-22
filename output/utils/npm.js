"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUnsafeNpmScript = runUnsafeNpmScript;
exports.runPostInstall = runPostInstall;
exports.runNpmScript = runNpmScript;
exports.runNpmInstall = runNpmInstall;
exports.installBaseDependencies = installBaseDependencies;
exports.packageExistsOnNpm = packageExistsOnNpm;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const cwd_1 = require("./cwd");
const execAsync = util_1.default.promisify(child_process_1.exec);
function runUnsafeNpmScript(projectDir, scriptName) {
    console.log(chalk_1.default.blue(`💡 Command: ${chalk_1.default.cyan(`npm run ${scriptName}`)}`));
    const npmProcess = (0, child_process_1.spawn)("npm", ["run", scriptName], {
        cwd: projectDir,
        stdio: "inherit",
        shell: true,
    });
    npmProcess.on("close", (code) => {
        if (code === 0) {
            console.log(chalk_1.default.green(`✅ "${scriptName}" script completed successfully.`));
        }
        else {
            console.log(chalk_1.default.red(`❌ "${scriptName}" script failed with code ${code}.`));
        }
        process.exit(code || 1);
    });
}
async function runPostInstall(pluginName, cwd, postInstallCommand) {
    console.log(chalk_1.default.blue(`💡 Command: ${chalk_1.default.cyan(postInstallCommand)}`));
    try {
        const { stdout, stderr } = await execAsync(postInstallCommand, { cwd });
        if (stdout)
            console.log(chalk_1.default.green(`✅ Output:\n${stdout}`));
        if (stderr)
            console.log(chalk_1.default.red(`⚠️ Errors:\n${stderr}`));
        console.log(chalk_1.default.green(`✅ Post-install script completed successfully.`));
    }
    catch (error) {
        console.log(chalk_1.default.red(`❌ Failed to execute post-install script:`));
        console.error(chalk_1.default.red(`💥 Error: ${error.message}`));
    }
}
function runNpmScript(scriptName) {
    console.log(chalk_1.default.blue(`💡 Command: ${chalk_1.default.cyan(`npm run ${scriptName}`)}`));
    try {
        const packageJsonPath = (0, cwd_1.findNearestPackageJson)();
        if (!packageJsonPath) {
            console.error(chalk_1.default.red("❌ No package.json found in the current directory or its parents."));
            process.exit(1);
        }
        const projectDir = path_1.default.dirname(packageJsonPath);
        const pkg = JSON.parse(fs_1.default.readFileSync(packageJsonPath, "utf-8"));
        if (!pkg.scripts || !pkg.scripts[scriptName]) {
            console.error(chalk_1.default.red(`❌ The script "${scriptName}" is not defined in package.json.`));
            process.exit(1);
        }
        const npmProcess = (0, child_process_1.spawn)("npm", ["run", scriptName], {
            cwd: projectDir,
            stdio: "inherit",
            shell: true,
        });
        npmProcess.on("close", (code) => {
            if (code === 0) {
                console.log(chalk_1.default.green(`✅ "${scriptName}" script completed successfully.`));
            }
            else {
                console.log(chalk_1.default.red(`❌ "${scriptName}" script failed with code ${code}.`));
            }
        });
    }
    catch (error) {
        console.log(chalk_1.default.red(`❌ "${scriptName}" script failed with code ${error}.`));
        console.error(chalk_1.default.red("❌ An error occurred while running the script:"), error.message);
    }
}
/**
 * Run `npm install` in the specified directory.
 * @param projectDir The directory where the command should be executed.
 */
async function runNpmInstall(projectDir) {
    console.log(chalk_1.default.blue(`Installing dependencies in ${projectDir}...`));
    return new Promise((resolve, reject) => {
        const npmProcess = (0, child_process_1.spawn)("npm", ["install", "--omit=optional"], {
            cwd: projectDir,
            stdio: "inherit",
            shell: true,
        });
        npmProcess.on("close", (code) => {
            if (code === 0) {
                console.log(chalk_1.default.green("✅ Dependencies installed successfully!"));
                resolve();
            }
            else {
                console.log(chalk_1.default.red(`❌ npm install failed with exit code ${code}.`));
                reject(new Error(`Failed to install dependencies. Exit code: ${code}`));
            }
        });
        npmProcess.on("error", (error) => {
            console.log(chalk_1.default.red(`❌ npm install encountered an error: ${error.message}`));
            reject(error);
        });
    });
}
async function installBaseDependencies(projectDir) {
    console.log(chalk_1.default.blue("\n📦 Installing base dependencies...\n"));
    const baseDependencies = [
        "axios",
        "@tsdiapi/server",
        "reflect-metadata",
        "class-transformer",
        "class-validator",
        "routing-controllers",
        "routing-controllers-openapi",
        "routing-controllers-openapi-extra",
        "typedi"
    ];
    const devDependencies = [
        "@types/node",
        "cpy-cli",
        "cross-env",
        "nodemon",
        "ts-node",
        "tslib",
        "typescript",
        "@types/express"
    ];
    const spinner = (0, ora_1.default)({
        text: chalk_1.default.yellow("⏳ Installing dependencies..."),
        spinner: "dots"
    }).start();
    try {
        await execAsync(`npm install ${baseDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk_1.default.green("✅ Base dependencies installed!"));
        spinner.text = chalk_1.default.yellow("🔧 Installing dev dependencies...");
        spinner.start();
        await execAsync(`npm install -D ${devDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk_1.default.green("✅ Dev dependencies installed!"));
        //console.log(chalk.blue("\n🚀 Setup complete! Your project is now ready to go.\n"));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red("❌ Installation failed!"));
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
async function packageExistsOnNpm(packageName, silent) {
    const spinner = silent
        ? null
        : (0, ora_1.default)({
            text: chalk_1.default.blue(`🔍 Checking NPM for package: ${chalk_1.default.bold(packageName)}...`),
            color: "cyan",
        }).start();
    try {
        const response = await (0, node_fetch_1.default)(`https://registry.npmjs.org/${packageName}`);
        if (response.ok) {
            spinner?.succeed(chalk_1.default.green(`✅ Package ${chalk_1.default.bold(packageName)} is available on NPM.`));
            return true;
        }
        else {
            spinner?.fail(chalk_1.default.red(`❌ Package ${chalk_1.default.bold(packageName)} does not exist on NPM.`));
            return false;
        }
    }
    catch (error) {
        spinner?.fail(chalk_1.default.red(`❌ Failed to check package: ${error.message}`));
        return false;
    }
}
//# sourceMappingURL=npm.js.map