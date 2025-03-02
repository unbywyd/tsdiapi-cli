"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptPluginDetails = promptPluginDetails;
exports.installDependencies = installDependencies;
exports.promptMessages = promptMessages;
exports.promptAfterInstall = promptAfterInstall;
exports.promptRequiredPackages = promptRequiredPackages;
exports.promptRequiredPaths = promptRequiredPaths;
exports.promptPostInstall = promptPostInstall;
exports.promptProvideScripts = promptProvideScripts;
exports.promptPluginVariables = promptPluginVariables;
exports.promptFiles = promptFiles;
const config_1 = require("./../config");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const format_1 = require("./format");
const path_1 = __importDefault(require("path"));
const hbs_1 = require("./hbs");
const npm_1 = require("./npm");
const ora_1 = __importDefault(require("ora"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
async function loadBoxen() {
    return (await eval('import("boxen")')).default;
}
const execAsync = util_1.default.promisify(child_process_1.exec);
async function promptPluginDetails(sourcePluginName) {
    try {
        const pluginName = (0, format_1.toLowerCase)(sourcePluginName);
        const regexp = /^[a-z0-9-]+$/;
        const minLen = 3;
        const maxLen = 50;
        if (!regexp.test(pluginName)) {
            console.log(chalk_1.default.red(`❌ Invalid plugin name: ${pluginName}. Plugin name must be lowercase and contain only letters, numbers, and hyphens.`));
            return;
        }
        if (pluginName.length < minLen || pluginName.length > maxLen) {
            console.log(chalk_1.default.red(`❌ Invalid plugin name: ${pluginName}. Plugin name must be between ${minLen} and ${maxLen} characters.`));
            return;
        }
        const nonAcceptablePluginNames = ["feature", "controller", "service", "middleware", "plugin"];
        if (nonAcceptablePluginNames.includes(pluginName)) {
            console.log(chalk_1.default.red(`❌ Invalid plugin name: ${pluginName}. Plugin name must not be one of the following: ${nonAcceptablePluginNames.join(", ")}.`));
            return;
        }
        const pluginFullName = pluginName.startsWith('tsdiapi') ? pluginName : 'tsdiapi-' + pluginName;
        const pluginDir = path_1.default.join(process.cwd(), pluginFullName);
        if (fs_extra_1.default.existsSync(pluginDir)) {
            console.log(chalk_1.default.red(`❌ Plugin directory already exists: ${pluginDir}. Please choose a different name.`));
            return;
        }
        const packageName = (0, config_1.getPackageName)(pluginName);
        const isExists = await (0, npm_1.packageExistsOnNpm)(packageName, true);
        if (isExists) {
            console.log(chalk_1.default.red(`❌ Plugin package already exists on npm: ${packageName}. Please choose a different name.`));
            return;
        }
        console.log(chalk_1.default.cyan(`🔧 Configuring plugin: ${chalk_1.default.bold(pluginName)}`));
        const answers = await inquirer_1.default.prompt([
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
            },
            {
                type: "confirm",
                name: "withBootstrapFiles",
                message: "⚙️ Should this plugin support automatic file loading?",
                default: false
            }
        ]);
        let variables = [], promptPost = null, promptScripts = null, afterInstall = null, requiredPackages = [], requiredPaths = [], preMessages = [], postMessages = [];
        try {
            variables = await promptPluginVariables(packageName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring plugin variables: ${error.message}`));
        }
        try {
            requiredPackages = await promptRequiredPackages();
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring required packages: ${error.message}`));
        }
        try {
            requiredPaths = await promptRequiredPaths();
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring required paths: ${error.message}`));
        }
        try {
            promptPost = await promptPostInstall(pluginName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring post-install: ${error.message}`));
        }
        try {
            afterInstall = await promptAfterInstall(pluginName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring after-install: ${error.message}`));
        }
        try {
            promptScripts = await promptProvideScripts(pluginName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring scripts: ${error.message}`));
        }
        try {
            preMessages = await promptMessages(pluginName, "🚀 Do you want to display messages before installing?");
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring pre-install messages: ${error.message}`));
        }
        try {
            postMessages = await promptMessages(pluginName, "🚀 Do you want to display messages after installing?");
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring post-install messages: ${error.message}`));
        }
        let files = [];
        try {
            files = await promptFiles(pluginName);
        }
        catch (error) {
            if (checkIfUserForsed(error)) {
                console.log(chalk_1.default.red(`❌ User force closed the prompt with 0 null`));
                process.exit(0);
            }
            console.error(chalk_1.default.red(`❌ Error while configuring files: ${error.message}`));
        }
        await fs_extra_1.default.ensureDir(pluginDir);
        console.log(chalk_1.default.cyan("📦 Creating plugin files..."));
        const sourceDir = path_1.default.resolve(__dirname, "../dev/project/copy");
        await fs_extra_1.default.copy(sourceDir, pluginDir);
        console.log(chalk_1.default.cyan("📦 Creating package.json file..."));
        const packageData = (0, hbs_1.devBuildHandlebarsTemplate)("project/package.hbs", {
            name: pluginName,
            ...answers
        });
        await fs_extra_1.default.writeFile(path_1.default.join(pluginDir, "package.json"), packageData);
        await installDependencies(pluginDir);
        const packageJsonPath = path_1.default.join(pluginDir, "package.json");
        const pkg = JSON.parse(fs_extra_1.default.readFileSync(packageJsonPath, "utf-8"));
        pkg.peerDependencies = pkg.dependencies;
        delete pkg.dependencies;
        fs_extra_1.default.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
        const gitignore = `
node_modules
# Keep environment variables out of version control
#.env
#.env.development
#.env.production

dist
logs/*  
`;
        await fs_extra_1.default.writeFile(path_1.default.join(pluginDir, ".gitignore"), gitignore);
        // README.hbs
        console.log(chalk_1.default.cyan("📦 Creating README.md file..."));
        const readmeData = (0, hbs_1.devBuildHandlebarsTemplate)("project/README.hbs", {
            name: pluginName,
            ...answers
        });
        await fs_extra_1.default.writeFile(path_1.default.join(pluginDir, "README.md"), readmeData);
        // index.ts
        console.log(chalk_1.default.cyan("📦 Creating index.ts file..."));
        const indexData = (0, hbs_1.devBuildHandlebarsTemplate)("project/index.hbs", {
            name: pluginName,
            ...answers
        });
        await fs_extra_1.default.ensureDir(path_1.default.join(pluginDir, "src"));
        await fs_extra_1.default.writeFile(path_1.default.join(pluginDir, "src/index.ts"), indexData);
        const providerData = (0, hbs_1.devBuildHandlebarsTemplate)("project/provider.hbs", {
            name: pluginName,
            ...answers
        });
        await fs_extra_1.default.writeFile(path_1.default.join(pluginDir, "src/provider.ts"), providerData);
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
        if (requiredPackages.length) {
            configData.requiredPackages = requiredPackages;
        }
        if (requiredPaths.length) {
            configData.requiredPaths = requiredPaths;
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
        const configPath = path_1.default.join(pluginDir, configName);
        if (!fs_extra_1.default.existsSync(configPath)) {
            console.log(chalk_1.default.cyan(`Creating ${configName} file...`));
            await fs_extra_1.default.writeFile(configPath, JSON.stringify(configData, null, 2));
        }
        if (files.length) {
            const filesPath = path_1.default.join(pluginDir, "files");
            await fs_extra_1.default.ensureDir(filesPath);
        }
        if (answers.giturl) {
            try {
                process.chdir(pluginDir);
                console.log(chalk_1.default.cyan("🚀 Initializing git repository..."));
                await execAsync("git init");
                // Optional: add everything and commit
                await execAsync('git add .');
                await execAsync('git commit -m "Initial commit"');
                // Optional: set remote origin
                await execAsync(`git remote add origin ${answers.giturl}`);
                console.log(chalk_1.default.green("✅ Git repository initialized successfully!"));
            }
            catch (e) {
                console.log(chalk_1.default.red(`❌ Failed to initialize git repository: ${e.message}`));
            }
            finally {
                process.chdir(".."); // go back to original folder
            }
        }
        const message = `
${chalk_1.default.yellow.bold('🚀 Congratulations! Your TSDIAPI plugin has been successfully created!')}

${chalk_1.default.green('🎯 You are now part of the TSDIAPI development community!')}
${chalk_1.default.green('💡 Your plugin can extend TSDIAPI with new features, automation, and more.')}

${chalk_1.default.cyan('🔧 To start working on your plugin, explore the generated files and documentation.')}
${chalk_1.default.cyan('📖 Refer to the official TSDIAPI documentation for best practices.')}

${chalk_1.default.blue.bold('📢 Want to publish your plugin?')}
- To publish your plugin on npm under the official @tsdiapi scope:
  ✅ Ensure your plugin follows TSDIAPI’s best practices.
  ✅ Contact me to be added as a maintainer for npm publishing.
  ✅ Once approved, your plugin will be publicly available!

${chalk_1.default.gray('────────────────────────────────────────────')}
${chalk_1.default.gray('💡 Questions, feedback, or need approval for publishing?')}
${chalk_1.default.cyan('📧 Contact:')} ${chalk_1.default.white('unbywyd@gmail.com')}
`;
        const boxen = await loadBoxen();
        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));
        console.log(chalk_1.default.green("🎉 Plugin successfully configured! Wishing you success in development! 🚀"));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
    }
}
async function installDependencies(projectDir) {
    console.log(chalk_1.default.blue("📦 Installing base dependencies..."));
    const devDependencies = [
        "@tsdiapi/server", "@types/node", "typescript"
    ];
    const peerDependencies = [
        "reflect-metadata", "typedi"
    ];
    const spinner = (0, ora_1.default)({
        text: chalk_1.default.yellow("⏳ Installing dev dependencies..."),
        spinner: "dots"
    }).start();
    try {
        await execAsync(`npm install -D ${devDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk_1.default.green("✅ Dev dependencies installed!"));
        spinner.text = chalk_1.default.yellow("🔗 Installing peer dependencies...");
        spinner.start();
        await execAsync(`npm install ${peerDependencies.join(" ")}`, { cwd: projectDir });
        spinner.succeed(chalk_1.default.green("✅ Peer dependencies installed!"));
        console.log(chalk_1.default.blue("🚀 Setup complete! Your project is now ready to go."));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red("❌ Installation failed!"));
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
async function promptMessages(pluginName, prompt) {
    const { accept } = await inquirer_1.default.prompt([
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
        const { icon } = await inquirer_1.default.prompt([
            {
                type: "list",
                name: "icon",
                message: "🎨 Choose an icon for the message:",
                choices: [
                    "⚠️", "✅", "ℹ️", "❌", "🚀", "📦", "🔧", "📜", "👤", "🔗", "⚙️", "📖", "💡", "📢"
                ]
            }
        ]);
        const { message } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "message",
                message: "📝 Enter the message:"
            }
        ]);
        messages.push(`${icon} ${message}`);
        const { moreMessages } = await inquirer_1.default.prompt([
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
async function promptAfterInstall(pluginName) {
    const { accept } = await inquirer_1.default.prompt([
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
    const { command } = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "command",
            message: "📝 Enter the command to run after installation:"
        }
    ]);
    const { whenNeeded } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "whenNeeded",
            message: "🔧 Should this command run only when needed?",
            default: false
        }
    ]);
    if (whenNeeded) {
        const { condition } = await inquirer_1.default.prompt([
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
async function promptRequiredPackages() {
    const { accept } = await inquirer_1.default.prompt([
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
        const { packageName } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "packageName",
                message: "📝 Enter the package name to install:"
            }
        ]);
        packages.push(packageName);
        const { morePackages } = await inquirer_1.default.prompt([
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
async function promptRequiredPaths() {
    const { accept } = await inquirer_1.default.prompt([
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
        const { path } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "path",
                message: "📝 Enter the path to require:",
                default: "prisma/schema.prisma"
            }
        ]);
        paths.push(path);
        const { morePaths } = await inquirer_1.default.prompt([
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
async function promptPostInstall(pluginName) {
    const { accept } = await inquirer_1.default.prompt([
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
    const { postInstall } = await inquirer_1.default.prompt([
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
async function promptProvideScripts(pluginName) {
    const { accept } = await inquirer_1.default.prompt([
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
        const { command } = await inquirer_1.default.prompt([
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
            console.log(chalk_1.default.red("❌ Invalid command format. Please provide a valid script name and value."));
            continue;
        }
        commands[scriptName] = scriptValue;
        const { moreCommands } = await inquirer_1.default.prompt([
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
async function promptPluginVariables(pluginName) {
    const variables = [];
    const { useEnv } = await inquirer_1.default.prompt([
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
        const { name } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "name",
                message: "📌 Enter the variable name:",
                default: (0, format_1.toConstantCase)(pluginName + "_VARIABLE_NAME"),
                transformer: (input) => (0, format_1.toConstantCase)(input),
                validate: (input) => input ? true : "❌ Variable name must be only letters, numbers, and underscores."
            }
        ]);
        const { requestMessage } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "requestMessage",
                message: `📝 Enter a message to request ${chalk_1.default.yellow(name)}:`,
                default: `Enter value for ${name}`
            }
        ]);
        const { type } = await inquirer_1.default.prompt([
            {
                type: "list",
                name: "type",
                message: `🔢 Choose the type for ${chalk_1.default.yellow(name)}:`,
                choices: ["string", "number", "boolean", "enum"]
            }
        ]);
        let defaultValue = null;
        let choices = undefined;
        if (type === "enum") {
            const { enumValues } = await inquirer_1.default.prompt([
                {
                    type: "input",
                    name: "enumValues",
                    message: `📝 Enter possible values for ${chalk_1.default.yellow(name)} (comma-separated):`,
                    validate: (input) => input.includes(",") ? true : "❌ Enter at least two values, separated by commas."
                }
            ]);
            choices = enumValues.split(",").map((v) => v.trim());
            const { defaultEnum } = await inquirer_1.default.prompt([
                {
                    type: "list",
                    name: "defaultEnum",
                    message: `⚙️ Choose a default value for ${chalk_1.default.yellow(name)}:`,
                    choices
                }
            ]);
            defaultValue = defaultEnum;
        }
        else if (type !== "boolean") {
            const { defaultAnswer } = await inquirer_1.default.prompt([
                {
                    type: type === "number" ? "number" : "input",
                    name: "defaultAnswer",
                    message: `⚙️ Enter default value for ${chalk_1.default.yellow(name)} (leave empty if none):`,
                }
            ]);
            defaultValue = defaultAnswer || undefined;
        }
        else {
            const { defaultBool } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "defaultBool",
                    message: `⚙️ Default value for ${chalk_1.default.yellow(name)}?`,
                    default: true
                }
            ]);
            defaultValue = defaultBool;
        }
        const { configurable } = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "configurable",
                message: `🔧 Should ${chalk_1.default.yellow(name)} be configurable?`,
                default: true
            }
        ]);
        let when = null;
        if (type !== "boolean" && type !== "enum") {
            const { addCondition } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "addCondition",
                    message: `✅ Do you want to add condition for ${chalk_1.default.yellow(name)}?`,
                    default: false
                }
            ]);
            if (addCondition) {
                const { schema } = await inquirer_1.default.prompt([
                    {
                        type: "input",
                        name: "schema",
                        message: `📜 Enter JEXL Condition for ${chalk_1.default.yellow(name)}:`
                    }
                ]);
                when = schema;
            }
        }
        let validate = null;
        if (type !== "boolean" && type !== "enum") {
            const { addValidation } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "addValidation",
                    message: `✅ Do you want to add validation for ${chalk_1.default.yellow(name)}?`,
                    default: false
                }
            ]);
            if (addValidation) {
                const { validationType } = await inquirer_1.default.prompt([
                    {
                        type: "list",
                        name: "validationType",
                        message: "📜 Choose validation type:",
                        choices: ["Regular Expression", "JSON Schema"]
                    }
                ]);
                if (validationType === "Regular Expression") {
                    const { regex } = await inquirer_1.default.prompt([
                        {
                            type: "input",
                            name: "regex",
                            message: `🔍 Enter regex pattern (string format) for ${chalk_1.default.yellow(name)}:`
                        }
                    ]);
                    validate = regex;
                }
                else {
                    const { schema } = await inquirer_1.default.prompt([
                        {
                            type: "input",
                            name: "schema",
                            message: `📜 Enter JSON Schema for ${chalk_1.default.yellow(name)}:`
                        }
                    ]);
                    try {
                        validate = JSON.parse(schema);
                    }
                    catch {
                        console.log(chalk_1.default.red("❌ Invalid JSON Schema. Skipping validation."));
                        validate = null;
                    }
                }
            }
        }
        let transform = null;
        const { addTransform } = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "addTransform",
                message: `🔀 Do you want to add transformation for ${chalk_1.default.yellow(name)}?`,
                default: false
            }
        ]);
        if (addTransform) {
            const { transformExpr } = await inquirer_1.default.prompt([
                {
                    type: "input",
                    name: "transformExpr",
                    message: `🔄 Enter JEXL expression for ${chalk_1.default.yellow(name)} transformation (e.g., \`capitalize(x)\`):`
                }
            ]);
            transform = transformExpr;
        }
        const { moreVariables } = await inquirer_1.default.prompt([
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
async function promptFiles(pluginName) {
    const { accept } = await inquirer_1.default.prompt([
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
        const { source } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "source",
                message: "📝 Enter the source file path (relative to the plugin package, supports glob patterns):",
                default: "files/src/*.ts"
            }
        ]);
        const { destination } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "destination",
                message: "📝 Enter the destination folder path (relative to the project root):",
                default: "src/"
            }
        ]);
        const { isHandlebarsTemplate } = await inquirer_1.default.prompt([
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
        const { moreMappings } = await inquirer_1.default.prompt([
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
//# sourceMappingURL=dev-plugin.js.map