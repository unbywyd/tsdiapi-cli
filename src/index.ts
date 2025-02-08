#!/usr/bin/env node
import { program } from 'commander'
import { initProject } from './commands/initProject'
import { CurrentVersion } from './config'
import { addPlugin } from './utils/addPlugin'
import { runNpmScript } from './utils'
import { generateFeature, runGenerateCommand } from './utils/generate'

program.name('tsdiapi').description('CLI for managing TSDIAPI projects').version(CurrentVersion);

program.command('init <name>').description('Initialize a new TSDIAPI project')
  .option('-s, --skip', 'Skip all questions and use default settings')
  .action((name, options) => {
    initProject(name, {
      skipAll: options.skip || false
    });
  });

program.command('start <name>').description('Fast start a new TSDIAPI project')
  .action((name) => {
    initProject(name, {
      skipAll: true,
      startMode: true
    });
  });

export type CliOptions = {
  host?: string;
  installPrisma: boolean;
  installSocket: boolean;
  installCron: boolean;
  installInforu: boolean;
  installEvents: boolean;
  installS3: boolean;
  installJwt: boolean;
  installEmail: boolean;
  port?: number;
};
// init with create command
program
  .command('create <name>')
  .alias('c')
  .description('Create a new TSDIAPI project')
  .option('--prisma', 'Install Prisma')
  .option('--socket', 'Install Socket.IO')
  .option('--cron', 'Install Cron')
  .option('--s3', 'Install S3')
  .option('--events', 'Install Events')
  .option('--jwt', 'Install JWT Auth')
  .option('--inforu', 'Install Inforu for SMS')
  .option('--email', 'Install Email service')
  .action((name, options) => {
    initProject(name, {
      installPrisma: options.prisma,
      installSocket: options.socket,
      installCron: options.cron,
      installS3: options.s3,
      installEvents: options.events,
      installJwt: options.jwt,
      installInforu: options.inforu,
      installEmail: options.email
    } as Partial<CliOptions>);
  });



const addCommand = program.command('add').description('Add resources to your TSDIAPI project')
addCommand
  .command('plugin [pluginName]')
  .description('Add a plugin to your TSDIAPI project')
  .action(addPlugin)

const generateCommand = program
  .command('generate')
  .alias('g')
  .description('Generate new features or components for your TSDIAPI project');

generateCommand
  .command('feature [name]')
  .description('Generate a new feature')
  .action(generateFeature);

generateCommand
  .command('service <name>')
  .description('Generate a new service')
  .action((name) => runGenerateCommand('service', name));

generateCommand
  .command('controller <name>')
  .description('Generate a new controller')
  .action((name) => runGenerateCommand('controller', name));


generateCommand
  .command('event <name>')
  .description('Generate a new event')
  .action((name) => runGenerateCommand('event', name));


generateCommand
  .command('prisma <name>')
  .description('Generate a new Prisma resource')
  .action((name) => runGenerateCommand('prisma', name));

generateCommand
  .command('cron <name>')
  .description('Generate a new cron job')
  .action((name) => runGenerateCommand('cron', name));


program.command('build').description('Build the project').action(() => {
  runNpmScript('build');
});

// Команда для запуска скрипта dev
program.command('dev').description('Run the project in development mode').action(() => {
  runNpmScript('dev');
});


program.parse(process.argv)

