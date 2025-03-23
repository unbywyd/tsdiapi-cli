import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import ora from 'ora';
import util from 'util';
import boxen from 'boxen';
import { exec } from 'child_process';
import { toConstantCase, toLowerCase } from "../utils/format.js";
import { getPackageName } from '../config.js';
import { packageExistsOnNpm } from '../utils/npm.js';
import { devBuildHandlebarsTemplate } from '../utils/handlebars.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = util.promisify(exec);
export async function promptPluginDetails(sourcePluginName) {
    try {
        const pluginName = toLowerCase(sourcePluginName);
        const regexp = /^[a-z0-9-]+$/;
        const minLen = 3;
        const maxLen = 50;
        if (!regexp.test(pluginName)) {
            console.log(chalk.red(`❌ Invalid plugin name: ${pluginName}. Plugin name must be lowercase and contain only letters, numbers, and hyphens.`));
            return;
        }
        if (pluginName.length < minLen || pluginName.length > maxLen) {
            console.log(chalk.red(`❌ Invalid plugin name: ${pluginName}. Plugin name must be between ${minLen} and ${maxLen} characters.`));
            return;
        }
        const nonAcceptablePluginNames = ["feature", "controller", "service", "middleware", "plugin"];
        if (nonAcceptablePluginNames.includes(pluginName)) {
            console.log(chalk.red(`❌ Invalid plugin name: ${pluginName}. Plugin name must not be one of the following: ${nonAcceptablePluginNames.join(", ")}.`));
            return;
        }
        const pluginFullName = pluginName.startsWith('tsdiapi') ? pluginName : 'tsdiapi-' + pluginName;
        const pluginDir = path.join(process.cwd(), pluginFullName);
        if (fs.existsSync(pluginDir)) {
            console.log(chalk.red(`❌ Plugin directory already exists: ${pluginDir}. Please choose a different name.`));
            return;
        }
        const packageName = getPackageName(pluginName);
        const isExists = await packageExistsOnNpm(packageName, true);
        if (isExists) {
            console.log(chalk.red(`❌ Plugin package already exists on npm: ${packageName}. Please choose a different name.`));
            return;
        }
        console.log(chalk.cyan(`🔧 Configuring plugin: ${chalk.bold(pluginName)}`));
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "description",
                message: "📜 Enter a brief description of the plugin:",
                default: `A TSDIAPI plugin to extend API functionality with ${pluginName}.`
            },
            {
                type: "input",
                name: "author",
                message: "👤 Author (leave empty if not needed):",
                default: ""
            },
            {
                type: "input",
                name: "giturl",
                message: "🔗 GitHub repository URL (leave empty if not needed):",
                default: ""
            }
        ]);
        let variables = [], promptPost = null, promptScripts = null, afterInstall = null, preMessages = [], postMessages = [];
        try {
            variables = await promptPluginVariables(packageName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk.red(`❌ Error while configuring plugin variables: ${error.message}`));
        }
        try {
            promptPost = await promptPostInstall(pluginName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk.red(`❌ Error while configuring post-install: ${error.message}`));
        }
        try {
            afterInstall = await promptAfterInstall(pluginName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk.red(`❌ Error while configuring after-install: ${error.message}`));
        }
        try {
            promptScripts = await promptProvideScripts(pluginName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk.red(`❌ Error while configuring scripts: ${error.message}`));
        }
        try {
            preMessages = await promptMessages(pluginName, "🚀 Do you want to display messages before installing?");
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk.red(`❌ Error while configuring pre-install messages: ${error.message}`));
        }
        try {
            postMessages = await promptMessages(pluginName, "🚀 Do you want to display messages after installing?");
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk.red(`❌ Error while configuring post-install messages: ${error.message}`));
        }
        let files = [];
        try {
            files = await promptFiles(pluginName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk.red(`❌ Error while configuring files: ${error.message}`));
        }
        await fs.ensureDir(pluginDir);
        console.log(chalk.cyan("📦 Creating plugin files..."));
        const sourceDir = path.resolve(__dirname, "../dev/project/copy");
        await fs.copy(sourceDir, pluginDir);
        console.log(chalk.cyan("📦 Creating package.json file..."));
        const packageData = devBuildHandlebarsTemplate("project/package.hbs", {
            name: pluginName,
            ...answers
        });
        await fs.writeFile(path.join(pluginDir, "package.json"), packageData);
        await installDependencies(pluginDir);
        const packageJsonPath = path.join(pluginDir, "package.json");
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        pkg.peerDependencies = pkg.dependencies;
        delete pkg.dependencies;
        fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
        const gitignore = `
node_modules
# Keep environment variables out of version control
#.env
#.env.development
#.env.production

dist
logs/*  
`;
        await fs.writeFile(path.join(pluginDir, ".gitignore"), gitignore);
        // README.hbs
        console.log(chalk.cyan("📦 Creating README.md file..."));
        const readmeData = devBuildHandlebarsTemplate("project/README.hbs", {
            name: pluginName,
            ...answers
        });
        await fs.writeFile(path.join(pluginDir, "README.md"), readmeData);
        // index.ts
        console.log(chalk.cyan("📦 Creating index.ts file..."));
        const indexData = devBuildHandlebarsTemplate("project/index.hbs", {
            name: pluginName,
            ...answers
        });
        await fs.ensureDir(path.join(pluginDir, "src"));
        await fs.writeFile(path.join(pluginDir, "src/index.ts"), indexData);
        const providerData = devBuildHandlebarsTemplate("project/provider.hbs", {
            name: pluginName,
            ...answers
        });
        await fs.writeFile(path.join(pluginDir, "src/provider.ts"), providerData);
        /*
        *
        *   +++
        *
        */
        const configData = {
            name: pluginFullName,
            description: answers.description,
            variables,
            postMessages: [
                `✅ Plugin ${pluginFullName} has been successfully installed!`,
                `📖 Check the documentation for more details!`
            ]
        };
        if (promptScripts) {
            configData.provideScripts = promptScripts;
        }
        if (promptPost) {
            configData.postInstall = promptPost;
        }
        if (afterInstall) {
            configData.afterInstall = afterInstall;
        }
        if (preMessages.length) {
            configData.preMessages = preMessages;
        }
        if (postMessages.length) {
            configData.postMessages = postMessages;
        }
        if (files.length) {
            configData.files = files;
        }
        const configName = "tsdiapi.config.json";
        const configPath = path.join(pluginDir, configName);
        if (!fs.existsSync(configPath)) {
            console.log(chalk.cyan(`Creating ${configName} file...`));
            await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
        }
        if (files.length) {
            const filesPath = path.join(pluginDir, "files");
            await fs.ensureDir(filesPath);
        }
        if (answers.giturl) {
            try {
                process.chdir(pluginDir);
                console.log(chalk.cyan("🚀 Initializing git repository..."));
                await execAsync("git init");
                // Optional: add everything and commit
                await execAsync('git add .');
                await execAsync('git commit -m "Initial commit"');
                // Optional: set remote origin
                await execAsync(`git remote add origin ${answers.giturl}`);
                console.log(chalk.green("✅ Git repository initialized successfully!"));
            }
            catch (e) {
                console.log(chalk.red(`❌ Failed to initialize git repository: ${e.message}`));
            }
            finally {
                process.chdir(".."); // go back to original folder
            }
        }
        const message = `
${chalk.yellow.bold('🚀 Congratulations! Your TSDIAPI plugin has been successfully created!')}

${chalk.green('🎯 You are now part of the TSDIAPI development community!')}
${chalk.green('💡 Your plugin can extend TSDIAPI with new features, automation, and more.')}

${chalk.cyan('🔧 To start working on your plugin, explore the generated files and documentation.')}
${chalk.cyan('📖 Refer to the official TSDIAPI documentation for best practices.')}

${chalk.blue.bold('📢 Want to publish your plugin?')}
- To publish your plugin on npm under the official @tsdiapi scope:
  ✅ Ensure your plugin follows TSDIAPI’s best practices.
  ✅ Contact me to be added as a maintainer for npm publishing.
  ✅ Once approved, your plugin will be publicly available!

${chalk.gray('────────────────────────────────────────────')}
${chalk.gray('💡 Questions, feedback, or need approval for publishing?')}
${chalk.cyan('📧 Contact:')} ${chalk.white('unbywyd@gmail.com')}
`;
        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));
        console.log(chalk.green("🎉 Plugin successfully configured! Wishing you success in development! 🚀"));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
    }
}
export async function installDependencies(projectDir) {
    console.log(chalk.blue("📦 Installing base dependencies..."));
    const devDependencies = [
        "@tsdiapi/server", "@types/node", "typescript"
    ];
    const peerDependencies = [
        "reflect-metadata", "typedi"
    ];
    const spinner = ora({
        text: chalk.yellow("⏳ Installing dev dependencies..."),
        spinner: "dots"
    }).start();
    try {
        await execAsync(`npm install -D ${devDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk.green("✅ Dev dependencies installed!"));
        spinner.text = chalk.yellow("🔗 Installing peer dependencies...");
        spinner.start();
        await execAsync(`npm install ${peerDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk.green("✅ Peer dependencies installed!"));
        console.log(chalk.blue("🚀 Setup complete! Your project is now ready to go."));
    }
    catch (error) {
        spinner.fail(chalk.red("❌ Installation failed!"));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
export async function promptMessages(pluginName, prompt) {
    const { accept } = await inquirer.prompt([
        {
            type: "confirm",
            name: "accept",
            message: prompt,
            default: true
        }
    ]);
    if (!accept) {
        return [];
    }
    const messages = [];
    while (true) {
        const { icon } = await inquirer.prompt([
            {
                type: "list",
                name: "icon",
                message: "🎨 Choose an icon for the message:",
                choices: [
                    "⚠️", "✅", "ℹ️", "❌", "🚀", "📦", "🔧", "📜", "👤", "🔗", "⚙️", "📖", "💡", "📢"
                ]
            }
        ]);
        const { message } = await inquirer.prompt([
            {
                type: "input",
                name: "message",
                message: "📝 Enter the message:"
            }
        ]);
        messages.push(`${icon} ${message}`);
        const { moreMessages } = await inquirer.prompt([
            {
                type: "confirm",
                name: "moreMessages",
                message: "➕ Do you want to add another message?",
                default: false
            }
        ]);
        if (!moreMessages) {
            break;
        }
    }
    return messages;
}
export async function promptAfterInstall(pluginName) {
    const { accept } = await inquirer.prompt([
        {
            type: "confirm",
            name: "accept",
            message: `🚀 Do you want to run a command after installing ${pluginName}?`,
            default: true
        }
    ]);
    if (!accept) {
        return null;
    }
    const { command } = await inquirer.prompt([
        {
            type: "input",
            name: "command",
            message: "📝 Enter the command to run after installation:"
        }
    ]);
    const { whenNeeded } = await inquirer.prompt([
        {
            type: "confirm",
            name: "whenNeeded",
            message: "🔧 Should this command run only when needed?",
            default: false
        }
    ]);
    if (whenNeeded) {
        const { condition } = await inquirer.prompt([
            {
                type: "input",
                name: "condition",
                message: "📝 Enter the condition to run the command:"
            }
        ]);
        return {
            command,
            when: condition
        };
    }
    return {
        command
    };
}
// requiredPackages?: Array<string>;
export async function promptRequiredPackages() {
    const { accept } = await inquirer.prompt([
        {
            type: "confirm",
            name: "accept",
            message: "🚀 Does your plugin depend on any packages?",
            default: true
        }
    ]);
    if (!accept) {
        return [];
    }
    const packages = [];
    while (true) {
        const { packageName } = await inquirer.prompt([
            {
                type: "input",
                name: "packageName",
                message: "📝 Enter the package name to install:"
            }
        ]);
        packages.push(packageName);
        const { morePackages } = await inquirer.prompt([
            {
                type: "confirm",
                name: "morePackages",
                message: "➕ Do you want to add another package?",
                default: false
            }
        ]);
        if (!morePackages) {
            break;
        }
    }
    return packages;
}
// requiredPaths?: Array<string>;
export async function promptRequiredPaths() {
    const { accept } = await inquirer.prompt([
        {
            type: "confirm",
            name: "accept",
            message: "🚀 Does your plugin require any paths?",
            default: true
        }
    ]);
    if (!accept) {
        return [];
    }
    const paths = [];
    while (true) {
        const { path } = await inquirer.prompt([
            {
                type: "input",
                name: "path",
                message: "📝 Enter the path to require:",
                default: "prisma/schema.prisma"
            }
        ]);
        paths.push(path);
        const { morePaths } = await inquirer.prompt([
            {
                type: "confirm",
                name: "morePaths",
                message: "➕ Do you want to add another path?",
                default: false
            }
        ]);
        if (!morePaths) {
            break;
        }
    }
    return paths;
}
// request to postInstall
export async function promptPostInstall(pluginName) {
    const { accept } = await inquirer.prompt([
        {
            type: "confirm",
            name: "accept",
            message: `🚀 Do you want to run post-install for ${pluginName}?`,
            default: true
        }
    ]);
    if (!accept) {
        return null;
    }
    const { postInstall } = await inquirer.prompt([
        {
            type: "input",
            name: "postInstall",
            message: "📝 Enter the post-install command:",
            default: "npx prisma generate"
        }
    ]);
    return postInstall;
}
// provideScripts
export async function promptProvideScripts(pluginName) {
    const { accept } = await inquirer.prompt([
        {
            type: "confirm",
            name: "accept",
            message: `🚀 Do you want to provide scripts for ${pluginName}?`,
            default: false
        }
    ]);
    if (!accept) {
        return null;
    }
    const commands = {};
    while (true) {
        const { command } = await inquirer.prompt([
            {
                type: "input",
                name: "command",
                message: "📝 Enter the command in the format scriptName: scriptValue:",
                validate: (input) => {
                    if (!input) {
                        return "❌ Invalid command format. Please provide a valid script name and value.";
                    }
                    if (!input.includes(":")) {
                        return "❌ Invalid command format. Please provide a valid script name and value.";
                    }
                    return true;
                }
            }
        ]);
        const [scriptName, scriptValue] = command.split(":")?.map((v) => v.trim());
        if (!scriptName || !scriptValue) {
            console.log(chalk.red("❌ Invalid command format. Please provide a valid script name and value."));
            continue;
        }
        commands[scriptName] = scriptValue;
        const { moreCommands } = await inquirer.prompt([
            {
                type: "confirm",
                name: "moreCommands",
                message: "➕ Do you want to add another script?",
                default: false
            }
        ]);
        if (!moreCommands) {
            break;
        }
    }
    return commands;
}
export async function promptPluginVariables(pluginName) {
    const variables = [];
    const { useEnv } = await inquirer.prompt([
        {
            type: "confirm",
            name: "useEnv",
            message: "⚙️ Will your plugin use configuration via ENV variables?",
            default: true
        }
    ]);
    if (!useEnv) {
        return variables;
    }
    while (true) {
        const { name } = await inquirer.prompt([
            {
                type: "input",
                name: "name",
                message: "📌 Enter the variable name:",
                default: toConstantCase(pluginName + "_VARIABLE_NAME"),
                transformer: (input) => toConstantCase(input),
                validate: (input) => input ? true : "❌ Variable name must be only letters, numbers, and underscores."
            }
        ]);
        const { requestMessage } = await inquirer.prompt([
            {
                type: "input",
                name: "requestMessage",
                message: `📝 Enter a message to request ${chalk.yellow(name)}:`,
                default: `Enter value for ${name}`
            }
        ]);
        const { type } = await inquirer.prompt([
            {
                type: "list",
                name: "type",
                message: `🔢 Choose the type for ${chalk.yellow(name)}:`,
                choices: ["string", "number", "boolean", "enum"]
            }
        ]);
        let defaultValue = null;
        let choices = undefined;
        if (type === "enum") {
            const { enumValues } = await inquirer.prompt([
                {
                    type: "input",
                    name: "enumValues",
                    message: `📝 Enter possible values for ${chalk.yellow(name)} (comma-separated):`,
                    validate: (input) => input.includes(",") ? true : "❌ Enter at least two values, separated by commas."
                }
            ]);
            choices = enumValues.split(",").map((v) => v.trim());
            const { defaultEnum } = await inquirer.prompt([
                {
                    type: "list",
                    name: "defaultEnum",
                    message: `⚙️ Choose a default value for ${chalk.yellow(name)}:`,
                    choices
                }
            ]);
            defaultValue = defaultEnum;
        }
        else if (type !== "boolean") {
            const { defaultAnswer } = await inquirer.prompt([
                {
                    type: type === "number" ? "number" : "input",
                    name: "defaultAnswer",
                    message: `⚙️ Enter default value for ${chalk.yellow(name)} (leave empty if none):`,
                }
            ]);
            defaultValue = defaultAnswer || undefined;
        }
        else {
            const { defaultBool } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "defaultBool",
                    message: `⚙️ Default value for ${chalk.yellow(name)}?`,
                    default: true
                }
            ]);
            defaultValue = defaultBool;
        }
        const { configurable } = await inquirer.prompt([
            {
                type: "confirm",
                name: "configurable",
                message: `🔧 Should ${chalk.yellow(name)} be configurable?`,
                default: true
            }
        ]);
        let when = null;
        if (type !== "boolean" && type !== "enum") {
            const { addCondition } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "addCondition",
                    message: `✅ Do you want to add condition for ${chalk.yellow(name)}?`,
                    default: false
                }
            ]);
            if (addCondition) {
                const { schema } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "schema",
                        message: `📜 Enter JEXL Condition for ${chalk.yellow(name)}:`
                    }
                ]);
                when = schema;
            }
        }
        let validate = null;
        if (type !== "boolean" && type !== "enum") {
            const { addValidation } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "addValidation",
                    message: `✅ Do you want to add validation for ${chalk.yellow(name)}?`,
                    default: false
                }
            ]);
            if (addValidation) {
                const { validationType } = await inquirer.prompt([
                    {
                        type: "list",
                        name: "validationType",
                        message: "📜 Choose validation type:",
                        choices: ["Regular Expression", "JSON Schema"]
                    }
                ]);
                if (validationType === "Regular Expression") {
                    const { regex } = await inquirer.prompt([
                        {
                            type: "input",
                            name: "regex",
                            message: `🔍 Enter regex pattern (string format) for ${chalk.yellow(name)}:`
                        }
                    ]);
                    validate = regex;
                }
                else {
                    const { schema } = await inquirer.prompt([
                        {
                            type: "input",
                            name: "schema",
                            message: `📜 Enter JSON Schema for ${chalk.yellow(name)}:`
                        }
                    ]);
                    try {
                        validate = JSON.parse(schema);
                    }
                    catch {
                        console.log(chalk.red("❌ Invalid JSON Schema. Skipping validation."));
                        validate = null;
                    }
                }
            }
        }
        let transform = null;
        const { addTransform } = await inquirer.prompt([
            {
                type: "confirm",
                name: "addTransform",
                message: `🔀 Do you want to add transformation for ${chalk.yellow(name)}?`,
                default: false
            }
        ]);
        if (addTransform) {
            const { transformExpr } = await inquirer.prompt([
                {
                    type: "input",
                    name: "transformExpr",
                    message: `🔄 Enter JEXL expression for ${chalk.yellow(name)} transformation (e.g., \`capitalize(x)\`):`
                }
            ]);
            transform = transformExpr;
        }
        const { moreVariables } = await inquirer.prompt([
            {
                type: "confirm",
                name: "moreVariables",
                message: "➕ Do you want to add another variable?",
                default: false
            }
        ]);
        variables.push({
            name: name,
            type,
            default: defaultValue,
            configurable,
            description: requestMessage,
            inquirer: {
                type: type === "confirm" ? "confirm" : type === "boolean" ? "confirm" : type === "enum" ? "list" : "input",
                message: requestMessage,
                ...(choices ? { choices } : {}),
                default: defaultValue
            },
            ...(when ? { when } : {}),
            ...(validate ? { validate } : {}),
            ...(transform ? { transform } : {}),
            ...(choices ? { inquirer: { choices } } : {}),
        });
        if (!moreVariables) {
            break;
        }
    }
    return variables;
}
export async function promptFiles(pluginName) {
    const { accept } = await inquirer.prompt([
        {
            type: "confirm",
            name: "accept",
            message: `📁 Does your plugin contain files that need to be added to the project during configuration?`,
            default: true
        }
    ]);
    if (!accept) {
        return [];
    }
    const mappings = [];
    while (true) {
        const { source } = await inquirer.prompt([
            {
                type: "input",
                name: "source",
                message: "📝 Enter the source file path (relative to the plugin package, supports glob patterns):",
                default: "files/src/*.ts"
            }
        ]);
        const { destination } = await inquirer.prompt([
            {
                type: "input",
                name: "destination",
                message: "📝 Enter the destination folder path (relative to the project root):",
                default: "src/"
            }
        ]);
        const { isHandlebarsTemplate } = await inquirer.prompt([
            {
                type: "confirm",
                name: "isHandlebarsTemplate",
                message: "🔧 Is this a Handlebars template file?",
                default: false
            }
        ]);
        mappings.push({
            source,
            destination,
            isHandlebarsTemplate
        });
        const { moreMappings } = await inquirer.prompt([
            {
                type: "confirm",
                name: "moreMappings",
                message: "➕ Do you want to add another file mapping?",
                default: false
            }
        ]);
        if (!moreMappings) {
            break;
        }
    }
    return mappings;
}
const checkIfUserForsed = (source) => {
    const text = "User force closed the prompt with 0 null";
    if (source?.message?.includes(text)) {
        return true;
    }
    return false;
};
//# sourceMappingURL=dev-create-plg.js.map