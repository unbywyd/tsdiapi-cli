import fs from "fs-extra";
import path from "path";
import Handlebars from "handlebars";
import { spawn, exec } from "child_process";
import chalk from "chalk";
import util from "util";
import inquirer from "inquirer";
import { DefaultHost, DefaultPort } from "../config";
import { CliOptions } from "@src/commands/initProject";
const execAsync = util.promisify(exec);

/**
 * Builds a Handlebars template by loading the template file and compiling it with the provided data.
 * 
 * @param templateName - The name of the template file (without the .hbs extension).
 * @param data - The data object to populate the template.
 * @returns The compiled template as a string.
 */
export function buildHandlebarsTemplate(templateName: string, data: any): string {
    try {
        // Define the path to the templates directory
        const templatesDir = path.join(__dirname, '../', "templates");

        // Define the full path to the template file
        const templatePath = path.join(templatesDir, `${templateName}.hbs`);

        // Check if the template file exists
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }

        // Load the template content
        const templateContent = fs.readFileSync(templatePath, "utf8");

        // Compile the template using Handlebars
        const template = Handlebars.compile(templateContent);

        // Generate the output by passing the data to the compiled template
        return template(data);
    } catch (error) {
        console.error(`Error building template "${templateName}":`, error);
        throw error;
    }
}


/**
 * Run `npm install` in the specified directory.
 * @param projectDir The directory where the command should be executed.
 */
export async function runNpmInstall(projectDir: string) {
    console.log(chalk.blue("Installing dependencies..."));

    return new Promise<void>((resolve, reject) => {
        const npmProcess = spawn("npm", ["install", "--omit=optional"], {
            cwd: projectDir, // Указание директории, где будет запущена команда
            stdio: "inherit", // Подключение потоков вывода/ввода, чтобы видеть вывод команды
            shell: true, // Для поддержки команд на всех платформах
        });

        npmProcess.on("close", (code) => {
            if (code === 0) {
                console.log(chalk.green("Dependencies installed successfully!"));
                resolve();
            } else {
                console.log(chalk.red(`npm install exited with code ${code}`));
                reject(new Error("Failed to install dependencies."));
            }
        });
    });
}


export async function setupPrisma(projectDir: string) {
    try {
        console.log(chalk.blue("Installing Prisma and Prisma Client..."));

        // Устанавливаем prisma и @prisma/client
        await execAsync(`npm install prisma @prisma/client prisma-class-dto-generator`, { cwd: projectDir });
        console.log(chalk.green("Prisma and Prisma Client installed successfully."));

        // Уточняем, нужно ли инициализировать Prisma
        const { initPrisma } = await inquirer.prompt([
            {
                type: "confirm",
                name: "initPrisma",
                message: "Do you want to initialize Prisma now? (Creates schema.prisma and .env)",
                default: true
            }
        ]);

        if (initPrisma) {
            console.log(chalk.blue("Initializing Prisma..."));
            await execAsync(`npx prisma init`, { cwd: projectDir });
            console.log(chalk.green("Prisma initialized successfully."));

            const { dbConfig } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "dbConfig",
                    message: "Do you want to configure your database connection now?",
                    default: true
                }
            ]);

            if (dbConfig) {
                const { dbType } = await inquirer.prompt([
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
                        console.log(chalk.red("Unsupported database type selected."));
                        process.exit(1);
                }

                const envPath = path.join(projectDir, ".env");
                await updateEnvVariable(envPath, "DATABASE_URL", dbUrl);
            }

            const prismaSchemaPath = path.join(projectDir, "prisma", "schema.prisma");
            const generatorConfigPath = path.join(projectDir, "prisma", "generator-config.json");
            if (fs.existsSync(prismaSchemaPath)) {
                const schemaContent = fs.readFileSync(prismaSchemaPath, "utf8");
                const generatorBlock = `
generator dto_generator {
    provider = "node node_modules/prisma-class-dto-generator"
    output   = "../src/generated_prisma_dto"
}
`;
                if (!schemaContent.includes("generator dto_generator")) {
                    fs.appendFileSync(prismaSchemaPath, generatorBlock);
                    console.log(chalk.green("Generator block for class-validator added to schema.prisma."));
                } else {
                    console.log(chalk.yellow("Generator block for class-validator already exists in schema.prisma."));
                }
            }
            if (!fs.existsSync(generatorConfigPath)) {
                const dtoConfig = buildHandlebarsTemplate("prisma_dto_config", {});
                fs.writeFileSync(generatorConfigPath, dtoConfig);
            }

            const typesContent = buildHandlebarsTemplate("prisma_types", {});
            const typesFilePath = path.join(projectDir, "src", "prisma.types.ts");
            fs.writeFileSync(typesFilePath, typesContent);

            const testModel = `
            model User {
              id        String   @id @default(cuid())
              email     String   @unique
            }`;
            fs.appendFileSync(prismaSchemaPath, testModel);
            
            // prisma generate
            console.log(chalk.blue("Generating Prisma client..."));
            await execAsync(`npx prisma generate`, { cwd: projectDir });
            console.log(chalk.green("Prisma client generated successfully."));

            // Обновляем package.json
            const packageJsonPath = path.join(projectDir, "package.json");
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }
            if (!packageJson.scripts.postinstall) {
                packageJson.scripts.postinstall = "prisma generate";
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                console.log(chalk.green("Added 'prisma generate' to postinstall script in package.json."));
            }

            // Вывод инструкций
            console.log(chalk.blue("Prisma setup is complete! Next steps:"));
            console.log(chalk.green(`
1. Verify your database configuration in the .env file
2. Run migrations: npx prisma migrate dev
3. Generate Prisma client: npx prisma generate
            `));
        } else {
            console.log(chalk.yellow("Skipping Prisma initialization. You can initialize it later with 'npx prisma init'."));
        }
    } catch (error) {
        console.error(chalk.red("An error occurred while setting up Prisma:"), error.message);
        //process.exit(1);
    }
}


// Функция для настройки PostgreSQL
async function configurePostgres() {
    const answers = await inquirer.prompt([
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
    const answers = await inquirer.prompt([
        { type: "input", name: "host", message: "MySQL host:", default: "localhost" },
        { type: "input", name: "port", message: "MySQL port:", default: "3306" },
        { type: "input", name: "user", message: "MySQL user:", default: "root" },
        { type: "password", name: "password", message: "MySQL password:" },
        { type: "input", name: "database", message: "MySQL database name:", default: "mydb" },
    ]);
    return `mysql://${answers.user}:${answers.password}@${answers.host}:${answers.port}/${answers.database}`;
}

// Функция для настройки SQLite
function configureSQLite(projectDir: string) {
    const dbPath = path.join(projectDir, "prisma", "dev.db");
    return `file:${dbPath}`;
}

// Функция для настройки SQL Server
async function configureSQLServer() {
    const answers = await inquirer.prompt([
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
export function updateEnvVariable(envPath: string, key: string, value: string) {
    try {
        let envContent = "";

        // Check if .env exists, if not create an empty one
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf8");
        } else {
            console.log(chalk.yellow(`.env file not found. Creating a new one at ${envPath}.`));
            fs.writeFileSync(envPath, "");
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
        fs.writeFileSync(envPath, updatedLines.join("\n"), "utf8");
        console.log(chalk.green(`${key} updated in .env.`));
    } catch (error) {
        console.error(chalk.red(`Failed to update ${key} in .env:`), error.message);
    }
}


export async function setupSockets(projectDir: string, options: CliOptions) {
    try {
        console.log(chalk.blue("Installing Socket.IO and Socket-Controllers..."));

        // Install socket.io and socket-controllers
        await execAsync(`npm install socket.io socket-controllers`, { cwd: projectDir });
        console.log(chalk.green("Socket.IO and Socket-Controllers installed successfully."));

        // Create a sample socket type definition file
        const socketFilePath = path.join(projectDir, "src", "sockets.types.ts");
        const socketFileContent = buildHandlebarsTemplate("sockets_types", {});
        fs.writeFileSync(socketFilePath, socketFileContent);

        // Create a sample feature controller

        const helloControllerPath = path.join(projectDir, "src", "api", "features", "hello");
        fs.ensureDirSync(helloControllerPath);

        const helloFilePath = path.join(helloControllerPath, "hello.socket.ts");
        const helloControllerContent = buildHandlebarsTemplate("hello_socket_controller", {});
        fs.writeFileSync(helloFilePath, helloControllerContent);

        // Display configuration information
        console.log(chalk.green("Sockets are ready to use!"));
        console.log(chalk.blue(`
You can now create socket controllers by placing files ending with *.socket.ts
anywhere inside the "api" directory of your project. A sample controller is available at:
  ${helloControllerPath}

The server will automatically detect and load socket controllers.
Make sure to configure your host and port in the .env file:
  HOST=${DefaultHost}
  PORT=${options.port || DefaultPort}
        `));
    } catch (error) {
        console.error(chalk.red("An error occurred while setting up Socket.IO:"), error.message);
    }
}


export function setupCron(projectDir: string) {
    try {
        // Install node-cron
        console.log(chalk.green("node-cron installed successfully."));
        // Create a sample cron job
        const helloControllerPath = path.join(projectDir, "src", "api", "features", "hello");
        fs.ensureDirSync(helloControllerPath);

        const cronFilePath = path.join(helloControllerPath, "hello.cron.ts");
        const cronFileContent = buildHandlebarsTemplate("sample_cron_job", {});
        fs.writeFileSync(cronFilePath, cronFileContent);

        // Display configuration information
        console.log(chalk.green("Cron jobs are ready to use!"));
        console.log(chalk.blue(`
You can now create cron jobs by placing files ending with *.cron.ts
inside the "cron" directory of your project. A sample cron job is available at: ${cronFilePath}
The server will automatically detect and run cron jobs.`));
    } catch (error) {
        console.error(chalk.red("An error occurred while setting up node-cron:"), error.message);
    }
}