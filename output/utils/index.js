"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHandlebarsTemplate = buildHandlebarsTemplate;
exports.runNpmInstall = runNpmInstall;
exports.setupPrisma = setupPrisma;
exports.updateEnvVariable = updateEnvVariable;
exports.setupSockets = setupSockets;
exports.setupCron = setupCron;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const util_1 = __importDefault(require("util"));
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../config");
const execAsync = util_1.default.promisify(child_process_1.exec);
/**
 * Builds a Handlebars template by loading the template file and compiling it with the provided data.
 *
 * @param templateName - The name of the template file (without the .hbs extension).
 * @param data - The data object to populate the template.
 * @returns The compiled template as a string.
 */
function buildHandlebarsTemplate(templateName, data) {
    try {
        // Define the path to the templates directory
        const templatesDir = path_1.default.join(__dirname, '../', "templates");
        // Define the full path to the template file
        const templatePath = path_1.default.join(templatesDir, `${templateName}.hbs`);
        // Check if the template file exists
        if (!fs_extra_1.default.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }
        // Load the template content
        const templateContent = fs_extra_1.default.readFileSync(templatePath, "utf8");
        // Compile the template using Handlebars
        const template = handlebars_1.default.compile(templateContent);
        // Generate the output by passing the data to the compiled template
        return template(data);
    }
    catch (error) {
        console.error(`Error building template "${templateName}":`, error);
        throw error;
    }
}
/**
 * Run `npm install` in the specified directory.
 * @param projectDir The directory where the command should be executed.
 */
async function runNpmInstall(projectDir) {
    console.log(chalk_1.default.blue("Installing dependencies..."));
    return new Promise((resolve, reject) => {
        const npmProcess = (0, child_process_1.spawn)("npm", ["install", "--omit=optional"], {
            cwd: projectDir, // Указание директории, где будет запущена команда
            stdio: "inherit", // Подключение потоков вывода/ввода, чтобы видеть вывод команды
            shell: true, // Для поддержки команд на всех платформах
        });
        npmProcess.on("close", (code) => {
            if (code === 0) {
                console.log(chalk_1.default.green("Dependencies installed successfully!"));
                resolve();
            }
            else {
                console.log(chalk_1.default.red(`npm install exited with code ${code}`));
                reject(new Error("Failed to install dependencies."));
            }
        });
    });
}
async function setupPrisma(projectDir) {
    try {
        console.log(chalk_1.default.blue("Installing Prisma and Prisma Client..."));
        // Устанавливаем prisma и @prisma/client
        await execAsync(`npm install prisma @prisma/client prisma-class-dto-generator`, { cwd: projectDir });
        console.log(chalk_1.default.green("Prisma and Prisma Client installed successfully."));
        // Уточняем, нужно ли инициализировать Prisma
        const { initPrisma } = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "initPrisma",
                message: "Do you want to initialize Prisma now? (Creates schema.prisma and .env)",
                default: true
            }
        ]);
        if (initPrisma) {
            console.log(chalk_1.default.blue("Initializing Prisma..."));
            await execAsync(`npx prisma init`, { cwd: projectDir });
            console.log(chalk_1.default.green("Prisma initialized successfully."));
            const { dbConfig } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "dbConfig",
                    message: "Do you want to configure your database connection now?",
                    default: true
                }
            ]);
            if (dbConfig) {
                const { dbType } = await inquirer_1.default.prompt([
                    {
                        type: "list",
                        name: "dbType",
                        message: "Select your database type:",
                        choices: ["PostgreSQL", "MySQL", "SQLite", "SQL Server"],
                    },
                ]);
                let dbUrl = "";
                switch (dbType) {
                    case "PostgreSQL":
                        dbUrl = await configurePostgres();
                        break;
                    case "MySQL":
                        dbUrl = await configureMySQL();
                        break;
                    case "SQLite":
                        dbUrl = configureSQLite(projectDir);
                        break;
                    case "SQL Server":
                        dbUrl = await configureSQLServer();
                        break;
                    default:
                        console.log(chalk_1.default.red("Unsupported database type selected."));
                        process.exit(1);
                }
                const envPath = path_1.default.join(projectDir, ".env");
                await updateEnvVariable(envPath, "DATABASE_URL", dbUrl);
            }
            const prismaSchemaPath = path_1.default.join(projectDir, "prisma", "schema.prisma");
            const generatorConfigPath = path_1.default.join(projectDir, "prisma", "generator-config.json");
            if (fs_extra_1.default.existsSync(prismaSchemaPath)) {
                const schemaContent = fs_extra_1.default.readFileSync(prismaSchemaPath, "utf8");
                const generatorBlock = `
generator dto_generator {
    provider = "node node_modules/prisma-class-dto-generator"
    output   = "../src/generated_prisma_dto"
}
`;
                if (!schemaContent.includes("generator dto_generator")) {
                    fs_extra_1.default.appendFileSync(prismaSchemaPath, generatorBlock);
                    console.log(chalk_1.default.green("Generator block for class-validator added to schema.prisma."));
                }
                else {
                    console.log(chalk_1.default.yellow("Generator block for class-validator already exists in schema.prisma."));
                }
            }
            if (!fs_extra_1.default.existsSync(generatorConfigPath)) {
                const dtoConfig = buildHandlebarsTemplate("prisma_dto_config", {});
                fs_extra_1.default.writeFileSync(generatorConfigPath, dtoConfig);
            }
            const typesContent = buildHandlebarsTemplate("prisma_types", {});
            const typesFilePath = path_1.default.join(projectDir, "src", "prisma.types.ts");
            fs_extra_1.default.writeFileSync(typesFilePath, typesContent);
            const testModel = `
            model User {
              id        String   @id @default(cuid())
              email     String   @unique
            }`;
            fs_extra_1.default.appendFileSync(prismaSchemaPath, testModel);
            // prisma generate
            console.log(chalk_1.default.blue("Generating Prisma client..."));
            await execAsync(`npx prisma generate`, { cwd: projectDir });
            console.log(chalk_1.default.green("Prisma client generated successfully."));
            // Обновляем package.json
            const packageJsonPath = path_1.default.join(projectDir, "package.json");
            const packageJson = JSON.parse(fs_extra_1.default.readFileSync(packageJsonPath, "utf-8"));
            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }
            if (!packageJson.scripts.postinstall) {
                packageJson.scripts.postinstall = "prisma generate";
                fs_extra_1.default.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                console.log(chalk_1.default.green("Added 'prisma generate' to postinstall script in package.json."));
            }
            // Вывод инструкций
            console.log(chalk_1.default.blue("Prisma setup is complete! Next steps:"));
            console.log(chalk_1.default.green(`
1. Verify your database configuration in the .env file
2. Run migrations: npx prisma migrate dev
3. Generate Prisma client: npx prisma generate
            `));
        }
        else {
            console.log(chalk_1.default.yellow("Skipping Prisma initialization. You can initialize it later with 'npx prisma init'."));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red("An error occurred while setting up Prisma:"), error.message);
        //process.exit(1);
    }
}
// Функция для настройки PostgreSQL
async function configurePostgres() {
    const answers = await inquirer_1.default.prompt([
        { type: "input", name: "host", message: "PostgreSQL host:", default: "localhost" },
        { type: "input", name: "port", message: "PostgreSQL port:", default: "5432" },
        { type: "input", name: "user", message: "PostgreSQL user:", default: "postgres" },
        { type: "password", name: "password", message: "PostgreSQL password:" },
        { type: "input", name: "database", message: "PostgreSQL database name:", default: "mydb" },
    ]);
    return `postgresql://${answers.user}:${answers.password}@${answers.host}:${answers.port}/${answers.database}`;
}
// Функция для настройки MySQL
async function configureMySQL() {
    const answers = await inquirer_1.default.prompt([
        { type: "input", name: "host", message: "MySQL host:", default: "localhost" },
        { type: "input", name: "port", message: "MySQL port:", default: "3306" },
        { type: "input", name: "user", message: "MySQL user:", default: "root" },
        { type: "password", name: "password", message: "MySQL password:" },
        { type: "input", name: "database", message: "MySQL database name:", default: "mydb" },
    ]);
    return `mysql://${answers.user}:${answers.password}@${answers.host}:${answers.port}/${answers.database}`;
}
// Функция для настройки SQLite
function configureSQLite(projectDir) {
    const dbPath = path_1.default.join(projectDir, "prisma", "dev.db");
    return `file:${dbPath}`;
}
// Функция для настройки SQL Server
async function configureSQLServer() {
    const answers = await inquirer_1.default.prompt([
        { type: "input", name: "host", message: "SQL Server host:", default: "localhost" },
        { type: "input", name: "port", message: "SQL Server port:", default: "1433" },
        { type: "input", name: "user", message: "SQL Server user:", default: "sa" },
        { type: "password", name: "password", message: "SQL Server password:" },
        { type: "input", name: "database", message: "SQL Server database name:", default: "mydb" },
    ]);
    return `sqlserver://${answers.user}:${answers.password}@${answers.host}:${answers.port};database=${answers.database}`;
}
/**
 * Updates or adds a key-value pair in the .env file.
 *
 * @param envPath - Path to the .env file.
 * @param key - The key to update or add (e.g., "DATABASE_URL").
 * @param value - The value to set for the key.
 */
function updateEnvVariable(envPath, key, value) {
    try {
        let envContent = "";
        // Check if .env exists, if not create an empty one
        if (fs_extra_1.default.existsSync(envPath)) {
            envContent = fs_extra_1.default.readFileSync(envPath, "utf8");
        }
        else {
            console.log(chalk_1.default.yellow(`.env file not found. Creating a new one at ${envPath}.`));
            fs_extra_1.default.writeFileSync(envPath, "");
        }
        // Split the content into lines
        const lines = envContent.split("\n");
        // Update the key-value pair if it exists, or add a new one if it doesn't
        let found = false;
        const updatedLines = lines.map((line) => {
            const [currentKey, ...rest] = line.split("=");
            if (currentKey.trim() === key) {
                found = true;
                return `${key}="${value}"`; // Replace the value
            }
            return line; // Keep the line as is
        });
        if (!found) {
            updatedLines.push(`${key}="${value}"`); // Add the new key-value pair
        }
        // Write the updated content back to the .env file
        fs_extra_1.default.writeFileSync(envPath, updatedLines.join("\n"), "utf8");
        console.log(chalk_1.default.green(`${key} updated in .env.`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Failed to update ${key} in .env:`), error.message);
    }
}
async function setupSockets(projectDir, options) {
    try {
        console.log(chalk_1.default.blue("Installing Socket.IO and Socket-Controllers..."));
        // Install socket.io and socket-controllers
        await execAsync(`npm install socket.io socket-controllers`, { cwd: projectDir });
        console.log(chalk_1.default.green("Socket.IO and Socket-Controllers installed successfully."));
        // Create a sample socket type definition file
        const socketFilePath = path_1.default.join(projectDir, "src", "sockets.types.ts");
        const socketFileContent = buildHandlebarsTemplate("sockets_types", {});
        fs_extra_1.default.writeFileSync(socketFilePath, socketFileContent);
        // Create a sample feature controller
        const helloControllerPath = path_1.default.join(projectDir, "src", "api", "features", "hello");
        fs_extra_1.default.ensureDirSync(helloControllerPath);
        const helloFilePath = path_1.default.join(helloControllerPath, "hello.socket.ts");
        const helloControllerContent = buildHandlebarsTemplate("hello_socket_controller", {});
        fs_extra_1.default.writeFileSync(helloFilePath, helloControllerContent);
        // Display configuration information
        console.log(chalk_1.default.green("Sockets are ready to use!"));
        console.log(chalk_1.default.blue(`
You can now create socket controllers by placing files ending with *.socket.ts
anywhere inside the "api" directory of your project. A sample controller is available at:
  ${helloControllerPath}

The server will automatically detect and load socket controllers.
Make sure to configure your host and port in the .env file:
  HOST=${config_1.DefaultHost}
  PORT=${options.port || config_1.DefaultPort}
        `));
    }
    catch (error) {
        console.error(chalk_1.default.red("An error occurred while setting up Socket.IO:"), error.message);
    }
}
function setupCron(projectDir) {
    try {
        // Install node-cron
        console.log(chalk_1.default.green("node-cron installed successfully."));
        // Create a sample cron job
        const helloControllerPath = path_1.default.join(projectDir, "src", "api", "features", "hello");
        fs_extra_1.default.ensureDirSync(helloControllerPath);
        const cronFilePath = path_1.default.join(helloControllerPath, "hello.cron.ts");
        const cronFileContent = buildHandlebarsTemplate("sample_cron_job", {});
        fs_extra_1.default.writeFileSync(cronFilePath, cronFileContent);
        // Display configuration information
        console.log(chalk_1.default.green("Cron jobs are ready to use!"));
        console.log(chalk_1.default.blue(`
You can now create cron jobs by placing files ending with *.cron.ts
inside the "cron" directory of your project. A sample cron job is available at: ${cronFilePath}
The server will automatically detect and run cron jobs.`));
    }
    catch (error) {
        console.error(chalk_1.default.red("An error occurred while setting up node-cron:"), error.message);
    }
}
//# sourceMappingURL=index.js.map