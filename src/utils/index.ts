import fs from 'fs-extra'
import path from 'path'
import Handlebars from 'handlebars'
import { spawn, exec } from 'child_process'
import chalk from 'chalk'
import util from 'util'
import inquirer from 'inquirer'
import { DefaultHost, DefaultPort } from '../config'
import { Project, SourceFile, ClassDeclaration } from 'ts-morph'
import crypto from 'crypto'
import { findNearestPackageJson } from './cwd'
import { CliOptions } from '..'

const execAsync = util.promisify(exec)


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
    const templatePath = path.join(__dirname, '../', 'templates', templateName + '.hbs')

    // Check if the template file exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }

    // Load the template content
    const templateContent = fs.readFileSync(templatePath, 'utf8')

    // Compile the template using Handlebars
    const template = Handlebars.compile(templateContent)

    // Generate the output by passing the data to the compiled template
    return template(data)
  } catch (error) {
    console.error(`Error building template "${templateName}":`, error)
    throw error
  }
}

/**
 * Run `npm install` in the specified directory.
 * @param projectDir The directory where the command should be executed.
 */
export async function runNpmInstall(projectDir: string) {
  console.log(chalk.blue('Installing dependencies...'))

  return new Promise<void>((resolve, reject) => {
    const npmProcess = spawn('npm', ['install', '--omit=optional'], {
      cwd: projectDir, // Указание директории, где будет запущена команда
      stdio: 'inherit', // Подключение потоков вывода/ввода, чтобы видеть вывод команды
      shell: true, // Для поддержки команд на всех платформах
    })

    npmProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('Dependencies installed successfully!'))
        resolve()
      } else {
        console.log(chalk.red(`npm install exited with code ${code}`))
        reject(new Error('Failed to install dependencies.'))
      }
    })
  })
}

export async function setupPrisma(projectDir: string) {
  try {
    console.log(chalk.blue('Installing Prisma and Prisma Client...'));
    const prismaSchemaPath = path.join(projectDir, 'prisma', 'schema.prisma')
    if (fs.existsSync(prismaSchemaPath)) {
      console.log(chalk.yellow('Prisma schema already exists. Skipping Prisma setup.'));
      return;
    }

    // Устанавливаем prisma и @prisma/client
    await execAsync(`npm install prisma @prisma/client prisma-class-dto-generator`, {
      cwd: projectDir,
    })
    console.log(chalk.green('Prisma and Prisma Client installed successfully.'))

    // Уточняем, нужно ли инициализировать Prisma
    const { initPrisma } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'initPrisma',
        message: 'Do you want to initialize Prisma now? (Creates schema.prisma and .env)',
        default: true,
      },
    ])

    if (initPrisma) {
      console.log(chalk.blue('Initializing Prisma...'))
      await execAsync(`npx prisma init`, { cwd: projectDir })
      console.log(chalk.green('Prisma initialized successfully.'))

      const { dbConfig } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'dbConfig',
          message: 'Do you want to configure your database connection now?',
          default: true,
        },
      ])

      if (dbConfig) {
        const { dbType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'dbType',
            message: 'Select your database type:',
            choices: ['PostgreSQL', 'MySQL', 'SQLite', 'SQL Server'],
          },
        ])
        let dbUrl = ''
        switch (dbType) {
          case 'PostgreSQL':
            dbUrl = await configurePostgres()
            break
          case 'MySQL':
            dbUrl = await configureMySQL()
            break
          case 'SQLite':
            dbUrl = configureSQLite(projectDir)
            break
          case 'SQL Server':
            dbUrl = await configureSQLServer()
            break
          default:
            console.log(chalk.red('Unsupported database type selected.'))
            process.exit(1)
        }

        const envPath = path.join(projectDir, '.env')
        await updateEnvVariable(envPath, 'DATABASE_URL', dbUrl)
      }


      const generatorConfigPath = path.join(projectDir, 'prisma', 'generator-config.json')
      if (fs.existsSync(prismaSchemaPath)) {
        const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8')
        const generatorBlock = `
generator dto_generator {
    provider = "node node_modules/prisma-class-dto-generator"
    output   = "../src/generated_prisma_dto"
}
`
        if (!schemaContent.includes('generator dto_generator')) {
          fs.appendFileSync(prismaSchemaPath, generatorBlock)
          console.log(chalk.green('Generator block for class-validator added to schema.prisma.'))
        } else {
          console.log(
            chalk.yellow('Generator block for class-validator already exists in schema.prisma.')
          )
        }
      }
      if (!fs.existsSync(generatorConfigPath)) {
        const dtoConfig = buildHandlebarsTemplate('prisma/dto_config', {})
        fs.writeFileSync(generatorConfigPath, dtoConfig)
      }

      const typesContent = buildHandlebarsTemplate('prisma/types', {})
      const typesFilePath = path.join(projectDir, 'src', 'prisma.types.ts')
      fs.writeFileSync(typesFilePath, typesContent)

      const testModel = `
            model User {
              id        String   @id @default(cuid())
              email     String   @unique
            }`
      fs.appendFileSync(prismaSchemaPath, testModel)

      // prisma generate
      console.log(chalk.blue('Generating Prisma client...'))
      await execAsync(`npx prisma generate`, { cwd: projectDir })
      console.log(chalk.green('Prisma client generated successfully.'))

      // Обновляем package.json
      const packageJsonPath = path.join(projectDir, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      if (!packageJson.scripts) {
        packageJson.scripts = {}
      }
      if (!packageJson.scripts.postinstall) {
        packageJson.scripts.postinstall = 'prisma generate'
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
        console.log(chalk.green("Added 'prisma generate' to postinstall script in package.json."))
      }

      // Вывод инструкций
      console.log(chalk.blue('Prisma setup is complete! Next steps:'))
      console.log(
        chalk.green(`
1. Verify your database configuration in the .env file
2. Run migrations: npx prisma migrate dev
3. Generate Prisma client: npx prisma generate
            `)
      )
    } else {
      console.log(
        chalk.yellow(
          "Skipping Prisma initialization. You can initialize it later with 'npx prisma init'."
        )
      )
    }
  } catch (error) {
    console.error(chalk.red('An error occurred while setting up Prisma:'), error.message)
    //process.exit(1);
  }
}

// Функция для настройки PostgreSQL
async function configurePostgres() {
  const answers = await inquirer.prompt([
    { type: 'input', name: 'host', message: 'PostgreSQL host:', default: 'localhost' },
    { type: 'input', name: 'port', message: 'PostgreSQL port:', default: '5432' },
    { type: 'input', name: 'user', message: 'PostgreSQL user:', default: 'postgres' },
    { type: 'password', name: 'password', message: 'PostgreSQL password:' },
    { type: 'input', name: 'database', message: 'PostgreSQL database name:', default: 'mydb' },
  ])
  return `postgresql://${answers.user}:${answers.password}@${answers.host}:${answers.port}/${answers.database}`
}

// Функция для настройки MySQL
async function configureMySQL() {
  const answers = await inquirer.prompt([
    { type: 'input', name: 'host', message: 'MySQL host:', default: 'localhost' },
    { type: 'input', name: 'port', message: 'MySQL port:', default: '3306' },
    { type: 'input', name: 'user', message: 'MySQL user:', default: 'root' },
    { type: 'password', name: 'password', message: 'MySQL password:' },
    { type: 'input', name: 'database', message: 'MySQL database name:', default: 'mydb' },
  ])
  return `mysql://${answers.user}:${answers.password}@${answers.host}:${answers.port}/${answers.database}`
}

// Функция для настройки SQLite
function configureSQLite(projectDir: string) {
  const dbPath = path.join(projectDir, 'prisma', 'dev.db')
  return `file:${dbPath}`
}

// Функция для настройки SQL Server
async function configureSQLServer() {
  const answers = await inquirer.prompt([
    { type: 'input', name: 'host', message: 'SQL Server host:', default: 'localhost' },
    { type: 'input', name: 'port', message: 'SQL Server port:', default: '1433' },
    { type: 'input', name: 'user', message: 'SQL Server user:', default: 'sa' },
    { type: 'password', name: 'password', message: 'SQL Server password:' },
    { type: 'input', name: 'database', message: 'SQL Server database name:', default: 'mydb' },
  ])
  return `sqlserver://${answers.user}:${answers.password}@${answers.host}:${answers.port};database=${answers.database}`
}

/**
 * Updates or adds a key-value pair in the .env file.
 *
 * @param envPath - Path to the .env file.
 * @param key - The key to update or add (e.g., "DATABASE_URL").
 * @param value - The value to set for the key.
 */

export function updateEnvVariable(envPath: string, key: string, value: string, onlyIfEmpty = false) {
  const envFilename = path.basename(envPath);

  try {
    let envContent = '';

    // Check if .env exists, if not create an empty one
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      console.log(chalk.yellow(`${envFilename} file not found. Creating a new one at ${envPath}.`));
      fs.writeFileSync(envPath, '');
    }

    // Split the content into lines
    const lines = envContent.split('\n');

    // Update the key-value pair if it exists, or add a new one if it doesn't
    let found = false;
    const updatedLines = lines.map((line) => {
      const [currentKey, ...rest] = line.split('=');

      if (currentKey.trim() === key) {
        found = true;

        // If `onlyIfEmpty` is true, do not overwrite existing non-empty values
        if (onlyIfEmpty && rest.join('=').trim() !== '') {
          console.log(chalk.yellow(`${key} already exists in ${envFilename} and will not be updated.`));
          return line;
        }

        return `${key}="${value}"`; // Replace or update the value
      }

      return line; // Keep the line as is
    });

    if (!found) {
      updatedLines.push(`${key}="${value}"`); // Add the new key-value pair if not found
    }

    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
    console.log(chalk.green(`${key} updated in ${envFilename}.`));
  } catch (error) {
    console.error(chalk.red(`Failed to update ${key} in ${envFilename}:`), error.message);
  }
}

export function updateAllEnvFilesWithVariable(projectDir: string, key: string, value: string, onlyIfEmpty = false) {
  const envPath = path.join(projectDir, '.env')
  if (fs.existsSync(envPath)) {
    updateEnvVariable(envPath, key, value, onlyIfEmpty)
  }
  const envExamplePath = path.join(projectDir, '.env.development')
  if (fs.existsSync(envExamplePath)) {
    updateEnvVariable(envExamplePath, key, value, onlyIfEmpty)
  }
  const envProductionPath = path.join(projectDir, '.env.production')
  if (fs.existsSync(envProductionPath)) {
    updateEnvVariable(envProductionPath, key, value, onlyIfEmpty)
  }
}

export async function setupSockets(projectDir: string, options?: CliOptions) {
  try {
    console.log(chalk.blue('Installing Socket.IO and Socket-Controllers...'))

    // Install socket.io and socket-controllers
    await execAsync(`npm install socket.io socket-controllers`, { cwd: projectDir })
    console.log(chalk.green('Socket.IO and Socket-Controllers installed successfully.'))

    // Create a sample socket type definition file
    const socketFilePath = path.join(projectDir, 'src', 'sockets.types.ts')
    if (!fs.existsSync(socketFilePath)) {
      const socketFileContent = buildHandlebarsTemplate('sockets/types', {})
      fs.writeFileSync(socketFilePath, socketFileContent)
    }

    // Create a sample feature controller

    const helloControllerPath = path.join(projectDir, 'src', 'api', 'features', 'hello')
    const helloFilePath = path.join(helloControllerPath, 'hello.socket.ts');
    if (!fs.existsSync(helloFilePath)) {
      fs.ensureDirSync(helloControllerPath)

      const helloControllerContent = buildHandlebarsTemplate('sockets/example', {})
      fs.writeFileSync(helloFilePath, helloControllerContent)
    }

    // Display configuration information
    console.log(chalk.green('Sockets are ready to use!'))
    console.log(
      chalk.blue(`
You can now create socket controllers by placing files ending with *.socket.ts
anywhere inside the "api" directory of your project. A sample controller is available at:
  ${helloControllerPath}

The server will automatically detect and load socket controllers.
Make sure to configure your host and port in the .env file:
  HOST=${DefaultHost}
  PORT=${options?.port || DefaultPort}
        `)
    )
  } catch (error) {
    console.error(chalk.red('An error occurred while setting up Socket.IO:'), error.message)
  }
}

export function setupCron(projectDir: string) {
  try {
    // Install node-cron
    console.log(chalk.green('node-cron installed successfully.'))
    // Create a sample cron job
    const helloControllerPath = path.join(projectDir, 'src', 'api', 'features', 'hello')
    const cronFilePath = path.join(helloControllerPath, 'hello.cron.ts');

    if (!fs.existsSync(cronFilePath)) {
      fs.ensureDirSync(helloControllerPath);
      const cronFileContent = buildHandlebarsTemplate('cron/example', {})
      fs.writeFileSync(cronFilePath, cronFileContent)
    }

    // Display configuration information
    console.log(chalk.green('Cron jobs are ready to use!'))
    console.log(
      chalk.blue(`
You can now create cron jobs by placing files ending with *.cron.ts
inside the "cron" directory of your project. A sample cron job is available at: ${cronFilePath}
The server will automatically detect and run cron jobs.`)
    )
  } catch (error) {
    console.error(chalk.red('An error occurred while setting up node-cron:'), error.message)
  }
}

/*
 *   Use this function to setup events in your project
 */
export function setupEvents(projectDir: string) {
  try {
    // Create a sample event type definition file
    const eventsFilePath = path.join(projectDir, 'src', 'events.types.ts')
    if (!fs.existsSync(eventsFilePath)) {
      const eventsFileContent = buildHandlebarsTemplate('events/types', {})
      fs.writeFileSync(eventsFilePath, eventsFileContent)
    }

    const helloControllerPath = path.join(projectDir, 'src', 'api', 'features', 'hello')
    const eventsExamplePath = path.join(helloControllerPath, 'hello.event.ts');
    if (!fs.existsSync(eventsExamplePath)) {
      fs.ensureDirSync(helloControllerPath);
      const eventsExampleContent = buildHandlebarsTemplate('events/example', {})
      fs.writeFileSync(eventsExamplePath, eventsExampleContent)
    }

    console.log(chalk.green('Events are ready to use!'))
    console.log(
      chalk.blue(`
You can now create event handlers by placing files ending with *.event.ts
anywhere inside the "api" directory of your project. A sample event handler is available at:
    ${eventsExamplePath}
        `)
    )
  } catch (error) {
    console.error(chalk.red('An error occurred while setting up events:'), error.message)
  }
}

export type AppParam = {
  key: string
  type: 'string' | 'number' | 'boolean'
}

export async function setupJWTAuth(projectDir: string) {
  console.log(chalk.blue('Configuring JWT settings...'));

  try {
    const randomSecret = crypto.randomBytes(32).toString('hex');
    const envName = "JWT_SECRET_KEY";
    updateAllEnvFilesWithVariable(projectDir, envName, randomSecret, true);

    const days30 = 30 * 24 * 60 * 60;
    const envName2 = "JWT_EXPIRATION_TIME";
    updateAllEnvFilesWithVariable(projectDir, envName2, days30.toString(), true);

  } catch (error) {
    console.error(chalk.red('An error occurred while setting up JWT:'), error.message);
  }

  try {
    await addJWTAppParams(projectDir);
  } catch (error) {
    console.error(
      chalk.red(
        'Something went wrong while configuring app.config.ts. Please configure it manually.'
      )
    );
  }

  try {
    const { setupJWT } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupJWT',
        message: 'Do you want to configure JWT settings?',
        default: true,
      },
    ]);
    if (!setupJWT) {
      return;
    }

    const { JWT_SECRET_KEY, JWT_EXPIRATION_TIME_MINUTES } = await inquirer.prompt([
      {
        type: 'input',
        name: 'JWT_SECRET_KEY',
        message: 'Enter your JWT secret key:',
        validate: (input) => (input ? true : 'JWT secret key cannot be empty.'),
      },
      {
        type: 'number',
        name: 'JWT_EXPIRATION_TIME_MINUTES',
        message: 'Enter your JWT expiration time in minutes:',
        validate: (input) => (input ? true : 'JWT expiration time cannot be empty.'),
      },
    ]);

    const JWT_EXPIRATION_TIME = JWT_EXPIRATION_TIME_MINUTES * 60;

    updateAllEnvFilesWithVariable(projectDir, 'JWT_SECRET_KEY', JWT_SECRET_KEY);
    updateAllEnvFilesWithVariable(projectDir, 'JWT_EXPIRATION_TIME', JWT_EXPIRATION_TIME.toString());

  } catch (error) {
    console.error(chalk.red('An error occurred while setting up JWT:'), error.message);
  }
}


export async function setupEmail(projectDir: string) {
  console.log(chalk.blue('Configuring Email settings...'));
  const templatePath = path.join(__dirname, '../', 'files/email/email.tpl');
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  const keys = ['SENDGRID_API_KEY', 'EMAIL_PROVIDER', 'SENDER_EMAIL', 'SMTP_USER', 'SMTP_PORT', 'SMTP_HOST', 'SMTP_PASS'];
  keys.forEach((key) => {
    updateAllEnvFilesWithVariable(projectDir, key, '', true); // Set default value 
  });

  const templateFilePath = path.join(projectDir, 'src', 'templates', 'email.hbs');
  if (!fs.existsSync(templateFilePath)) {
    fs.ensureDirSync(path.dirname(templateFilePath));
    fs.writeFileSync(templateFilePath, templateContent);
  }

  try {
    await addEmailAppParams(projectDir);
  } catch (error) {
    console.error(
      chalk.red(
        'Something went wrong while configuring app.config.ts. Please configure it manually.'
      )
    );
  }
  await configEmail(projectDir);
}
export async function addEmailAppParams(projectDir: string) {
  const paramsConfig = {
    SENDGRID_API_KEY: 'string',
    EMAIL_PROVIDER: 'string',
    SENDER_EMAIL: 'string',
    SMTP_USER: 'string',
    SMTP_PORT: 'number',
    SMTP_HOST: 'string',
    SMTP_PASS: 'string',
  }
  const params: AppParam[] = []
  for (const key in paramsConfig) {
    params.push({ key, type: (paramsConfig as any)[key] as 'string' | 'number' | 'boolean' })
  }
  await addAppConfigParams(projectDir, params)
}

export async function configEmail(projectDir: string) {
  // provider sendgrid or nodemailer

  try {
    const { setupEmail } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupEmail',
        message: 'Do you want to configure Email settings?',
        default: true,
      },
    ]);
    if (!setupEmail) {
      return;
    }

    const { EMAIL_PROVIDER } = await inquirer.prompt([
      {
        type: 'list',
        name: 'EMAIL_PROVIDER',
        message: 'Select email provider:',
        choices: ['sendgrid', 'nodemailer'],
      },
    ]);
    updateAllEnvFilesWithVariable(projectDir, 'EMAIL_PROVIDER', EMAIL_PROVIDER);

    if (EMAIL_PROVIDER === 'sendgrid') {
      const { SENDGRID_API_KEY, SENDER_EMAIL } = await inquirer.prompt([
        {
          type: 'input',
          name: 'SENDGRID_API_KEY',
          message: 'Enter your SendGrid API key:',
          validate: (input) => (input ? true : 'SendGrid API key cannot be empty.'),
        },
        {
          type: 'input',
          name: 'SENDER_EMAIL',
          message: 'Enter your sender email:',
          validate: (input) => (input ? true : 'Sender email cannot be empty.'),
        },
      ]);

      updateAllEnvFilesWithVariable(projectDir, 'SENDGRID_API_KEY', SENDGRID_API_KEY);
      updateAllEnvFilesWithVariable(projectDir, 'SENDER_EMAIL', SENDER_EMAIL);
    } else {
      const { SMTP_USER, SMTP_PORT, SMTP_HOST, SENDER_EMAIL, SMTP_PASS } = await inquirer.prompt([
        {
          type: 'input',
          name: 'SMTP_USER',
          message: 'Enter your SMTP user:',
          validate: (input) => (input ? true : 'SMTP user cannot be empty.'),
        },
        {
          type: 'password',
          name: 'SMTP_PASS',
          message: 'Enter your SMTP password:',
          mask: '*',
          validate: (input) => (input ? true : 'SMTP password cannot be empty.'),
        },
        {
          type: 'number',
          name: 'SMTP_PORT',
          message: 'Enter your SMTP port:',
          validate: (input) => (input ? true : 'SMTP port cannot be empty.'),
        },
        {
          type: 'input',
          name: 'SMTP_HOST',
          message: 'Enter your SMTP host:',
          validate: (input) => (input ? true : 'SMTP host cannot be empty.'),
        },
        {
          type: 'input',
          name: 'SENDER_EMAIL',
          message: 'Enter your sender email:',
          validate: (input) => (input ? true : 'Sender email cannot be empty.'),
        },
      ]);

      updateAllEnvFilesWithVariable(projectDir, 'SMTP_PASS', SMTP_PASS.toString());
      updateAllEnvFilesWithVariable(projectDir, 'SMTP_USER', SMTP_USER.toString());
      updateAllEnvFilesWithVariable(projectDir, 'SMTP_PORT', SMTP_PORT.toString());
      updateAllEnvFilesWithVariable(projectDir, 'SMTP_HOST', SMTP_HOST);
      updateAllEnvFilesWithVariable(projectDir, 'SENDER_EMAIL', SENDER_EMAIL);
    }
  } catch (error) {
    console.error(chalk.red('An error occurred while setting up Email:'), error.message);
  }
}



export async function setupInforu(projectDir: string) {
  console.log(chalk.blue('Configuring Inforu settings...'));
  try {
    await addInforuAppParams(projectDir);
  } catch (error) {
    console.error(
      chalk.red(
        'Something went wrong while configuring app.config.ts. Please configure it manually.'
      )
    );
  }
  await configInforu(projectDir);
}

export async function configInforu(projectDir: string) {
  try {

    const keys = ['INFORU_USERNAME', 'INFORU_PASSWORD', 'INFORU_SENDER_NAME'];
    keys.forEach((key) => {
      updateAllEnvFilesWithVariable(projectDir, key, '', true); // Set default value 
    });

    const { setupInforu } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupInforu',
        message: 'Do you want to configure Inforu settings?',
        default: true,
      },
    ]);

    if (!setupInforu) {
      // manual setup notification
      console.log(
        chalk.yellow(
          `You can configure Inforu settings manually by adding the following variables to your .env file: INFORU_USERNAME, INFORU_PASSWORD, INFORU_SENDER_NAME`
        )
      );
      return;
    }
    const inforuConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'INFORU_USERNAME',
        message: 'Enter your Inforu username:',
        validate: (input) => (input ? true : 'Inforu username cannot be empty.'),
      },
      {
        type: 'password',
        name: 'INFORU_PASSWORD',
        message: 'Enter your Inforu password:',
        mask: '*',
        validate: (input) => (input ? true : 'Inforu password cannot be empty.'),
      },
      {
        type: 'input',
        name: 'INFORU_SENDER_NAME',
        message: 'Enter your Inforu sender name:',
        validate: (input) => (input ? true : 'Inforu sender name cannot be empty.'),
      },
    ]);

    for (const key in inforuConfig) {
      updateAllEnvFilesWithVariable(projectDir, key, (inforuConfig as any)[key]);
    }
    console.log(chalk.green('.env file has been successfully updated with Inforu settings.'));
  } catch (e) {
    console.error(chalk.red('An error occurred while setting up Inforu:'), e.message);
  }
}

export async function addInforuAppParams(projectDir: string) {
  const paramsConfig = {
    INFORU_USERNAME: 'string',
    INFORU_PASSWORD: 'string',
    INFORU_SENDER_NAME: 'string',
  }
  const params: AppParam[] = []
  for (const key in paramsConfig) {
    params.push({ key, type: (paramsConfig as any)[key] as 'string' | 'number' | 'boolean' })
  }
}

export async function addJWTAppParams(projectDir: string) {
  const paramsConfig = {
    JWT_SECRET_KEY: 'string',
    JWT_EXPIRATION_TIME: 'number',
  }
  const params: AppParam[] = []
  for (const key in paramsConfig) {
    params.push({ key, type: (paramsConfig as any)[key] as 'string' | 'number' | 'boolean' })
  }
  await addAppConfigParams(projectDir, params)
}

export async function setupS3(projectDir: string) {
  try {
    console.log(chalk.blue('Configuring AWS settings...'))

    const keys = ["AWS_PUBLIC_BUCKET_NAME", "AWS_PRIVATE_BUCKET_NAME", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"];
    keys.forEach((key) => {
      updateAllEnvFilesWithVariable(projectDir, key, '', true); // Set default value 
    });

    try {
      await addS3AppParams(projectDir)
    } catch (error) {
      console.error(
        chalk.red(
          'Something went wrong while configuring app.config.ts. Please configure it manually.'
        )
      )
    }

    const { setupAWS } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupAWS',
        message: 'Do you want to configure AWS settings?',
        default: true,
      },
    ])
    if (!setupAWS) {
      return
    }

    // Prompt user for AWS configuration
    const awsConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'AWS_PUBLIC_BUCKET_NAME',
        message: 'Enter the name of the AWS public bucket:',
        validate: (input) => (input ? true : 'AWS public bucket name cannot be empty.'),
      },
      {
        type: 'input',
        name: 'AWS_PRIVATE_BUCKET_NAME',
        message: 'Enter the name of the AWS private bucket:',
        validate: (input) => (input ? true : 'AWS private bucket name cannot be empty.'),
      },
      {
        type: 'input',
        name: 'AWS_ACCESS_KEY_ID',
        message: 'Enter the AWS Access Key ID:',
        validate: (input) => (input ? true : 'AWS Access Key ID cannot be empty.'),
      },
      {
        type: 'password',
        name: 'AWS_SECRET_ACCESS_KEY',
        message: 'Enter the AWS Secret Access Key:',
        validate: (input) => (input ? true : 'AWS Secret Access Key cannot be empty.'),
        mask: '*', // Hide input for security
      },
      {
        type: 'input',
        name: 'AWS_REGION',
        message: 'Enter the AWS region:',
        default: 'us-east-1', // Provide a default region
      },
    ])

    for (const key in awsConfig) {
      updateAllEnvFilesWithVariable(projectDir, key, (awsConfig as any)[key])
    }

    console.log(chalk.green('.env file has been successfully updated with AWS settings.'))
  } catch (error) {
    console.error(chalk.red('An error occurred while setting up AWS configuration:'), error.message)
  }
}

/*
 *   Use this function to add S3 parameters to your project
 */
export async function addS3AppParams(projectDir: string) {
  const paramsConfig = {
    AWS_PUBLIC_BUCKET_NAME: 'string',
    AWS_PRIVATE_BUCKET_NAME: 'string',
    AWS_ACCESS_KEY_ID: 'string',
    AWS_SECRET_ACCESS_KEY: 'string',
    AWS_REGION: 'string',
  }
  const params: AppParam[] = []
  for (const key in paramsConfig) {
    params.push({ key, type: (paramsConfig as any)[key] as 'string' | 'number' | 'boolean' })
  }
  await addAppConfigParams(projectDir, params)
}

export async function addAppConfigParams(projectDir: string, params: AppParam[]) {
  try {
    const appConfigPath = path.join(projectDir, 'src/app.config.ts')

    // Initialize ts-morph project
    const project = new Project()
    const sourceFile: SourceFile = project.addSourceFileAtPath(appConfigPath)

    // Ensure required imports are present
    ensureImports(sourceFile, [
      { name: 'Expose', moduleSpecifier: 'class-transformer' },
      { name: 'Type', moduleSpecifier: 'class-transformer' },
      { name: 'IsString', moduleSpecifier: 'class-validator' },
      { name: 'IsNumber', moduleSpecifier: 'class-validator' },
      { name: 'IsBoolean', moduleSpecifier: 'class-validator' },
    ])

    // Find the class declaration
    const classDeclaration: ClassDeclaration | undefined = sourceFile.getClass('ConfigSchema')
    if (!classDeclaration) {
      return
    }

    params.forEach((param) => {
      // Check if the property already exists
      const existingProperty = classDeclaration.getProperty(param.key)
      if (existingProperty) {
        console.log(chalk.yellow(`Property '${param.key}' already exists in ConfigSchema.`))
        return
      }

      // Add the new property with decorators based on the type
      const typeMap = {
        string: 'String',
        number: 'Number',
        boolean: 'Boolean',
      }

      const property = classDeclaration.addProperty({
        name: param.key,
        type: param.type,
      })

      property.addDecorator({ name: 'Is' + capitalize(param.type), arguments: [] })
      property.addDecorator({ name: 'Expose', arguments: [] })
      property.addDecorator({
        name: 'Type',
        arguments: [`() => ${typeMap[param.type]}`],
      })
    })

    // Save the modified file
    await sourceFile.save()
    console.log(chalk.green('app.config.ts has been successfully updated.'))
  } catch (error) {
    console.error(chalk.red('An error occurred while updating app.config.ts:'), error.message)
  }
}

// Utility function to ensure imports are present or add them if missing
function ensureImports(
  sourceFile: SourceFile,
  imports: { name: string; moduleSpecifier: string }[]
) {
  imports.forEach(({ name, moduleSpecifier }) => {
    const existingImport = sourceFile
      .getImportDeclarations()
      .find((imp: any) => imp.getModuleSpecifierValue() === moduleSpecifier)

    if (existingImport) {
      // Check if the named import already exists
      const existingNamedImport = existingImport
        .getNamedImports()
        .find((n: any) => n.getName() === name)
      if (!existingNamedImport) {
        existingImport.addNamedImport(name)
      }
    } else {
      // Add the new import declaration
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namedImports: [name],
      })
    }
  })
}

// Utility function to capitalize a string
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function runUnsafeNpmScript(projectDir: string, scriptName: string) {
  const npmProcess = spawn('npm', ['run', scriptName], {
    cwd: projectDir,
    stdio: 'inherit',
    shell: true,
  });

  npmProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`"${scriptName}" script failed with code ${code}.`);
    }
    process.exit(code);
  });
}

// Функция запуска скрипта npm
export function runNpmScript(scriptName: string) {
  const packageJsonPath = findNearestPackageJson();
  const projectDir = path.dirname(packageJsonPath);
  if (!packageJsonPath) {
    console.error('No package.json found in the current directory or its parents.');
    process.exit(1);
  }

  const pkg = require(packageJsonPath);

  if (!pkg.scripts || !pkg.scripts[scriptName]) {
    console.error(`The "${scriptName}" script is not defined in ${packageJsonPath}.`);
    process.exit(1);
  }

  const npmProcess = spawn('npm', ['run', scriptName], {
    cwd: projectDir,
    stdio: 'inherit',
    shell: true,
  });

  npmProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`"${scriptName}" script failed with code ${code}.`);
    }
    process.exit(code);
  });
}


export function isValidProjectPath(inputPath: string): boolean {
  const pathPartRegex = /^[a-zA-Z0-9.-]+$/;

  try {
    const parts = inputPath.split('/');

    for (const part of parts) {
      if (part === '' || part.startsWith('..') || !pathPartRegex.test(part)) {
        return false;
      }
    }

    const resolvedPath = path.resolve(process.cwd(), inputPath);
    if (!resolvedPath.startsWith(process.cwd())) {
      console.log(chalk.red('Error: The project path must be within the current working directory.'));
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function getCdCommand(targetPath: string): string | false {
  const cwd = process.cwd();
  const fullPath = path.resolve(targetPath);
  if (cwd === fullPath) {
    return false;
  }
  const relativePath = path.relative(cwd, fullPath);

  if (relativePath.startsWith('..')) {
    return false;
  }
  return `cd ${relativePath}`;
}
export function isPathSuitableToNewProject(pathName: string): string | false {

  const isValidInputPath = isValidProjectPath(pathName);
  if (!isValidInputPath) {
    console.log(chalk.red('Error: The project path is not valid.'));
    return false;
  }
  const projectDir = path.resolve(process.cwd(), pathName);

  if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0) {
    console.log(chalk.red(`Error: A project already exists at ${projectDir} and is not empty.`));
    return false;
  }

  return projectDir;
}