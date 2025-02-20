#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const initProject_1 = require("./commands/initProject");
const config_1 = require("./config");
const plugins_1 = require("./utils/plugins");
const utils_1 = require("./utils");
const generate_1 = require("./utils/generate");
commander_1.program.name('tsdiapi').description('CLI for managing TSDIAPI projects').version(config_1.CurrentVersion);
commander_1.program.command('init <name>').description('Initialize a new TSDIAPI project')
    .option('-s, --skip', 'Skip all questions and use default settings')
    .action((name, options) => {
    (0, initProject_1.initProject)(name, {
        skipAll: options.skip || false
    });
});
commander_1.program.command('start <name>').description('Fast start a new TSDIAPI project')
    .action((name) => {
    (0, initProject_1.initProject)(name, {
        skipAll: true,
        startMode: true
    });
});
// init with create command
commander_1.program
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
    (0, initProject_1.initProject)(name, {
        installPrisma: options.prisma,
        installSocket: options.socket,
        installCron: options.cron,
        installS3: options.s3,
        installEvents: options.events,
        installJwt: options.jwt,
        installInforu: options.inforu,
        installEmail: options.email
    });
});
const pluginCommand = commander_1.program
    .command('plugins')
    .description('Manage plugins in your TSDIAPI project');
pluginCommand
    .command('add <pluginName>')
    .description('Add a plugin to your TSDIAPI project')
    .action((pluginName) => {
    (0, plugins_1.addPlugin)(pluginName);
});
pluginCommand
    .command('update <pluginName>')
    .description('Update an existing plugin in your TSDIAPI project')
    .action((pluginName) => {
    (0, plugins_1.updatePlugin)(pluginName);
});
const generateCommand = commander_1.program
    .command('generate')
    .alias('g')
    .description('Generate new features or components for your TSDIAPI project');
generateCommand
    .command('feature [name]')
    .description('Generate a new feature')
    .action(generate_1.generateFeature);
generateCommand
    .command('service <name>')
    .description('Generate a new service')
    .action((name) => (0, generate_1.runGenerateCommand)('service', name));
generateCommand
    .command('controller <name>')
    .description('Generate a new controller')
    .action((name) => (0, generate_1.runGenerateCommand)('controller', name));
generateCommand
    .command('event <name>')
    .description('Generate a new event')
    .action((name) => (0, generate_1.runGenerateCommand)('event', name));
generateCommand
    .command('prisma <name>')
    .description('Generate a new Prisma resource')
    .action((name) => (0, generate_1.runGenerateCommand)('prisma', name));
generateCommand
    .command('cron <name>')
    .description('Generate a new cron job')
    .action((name) => (0, generate_1.runGenerateCommand)('cron', name));
commander_1.program.command('build').description('Build the project').action(() => {
    (0, utils_1.runNpmScript)('build');
});
// Команда для запуска скрипта dev
commander_1.program.command('dev').description('Run the project in development mode').action(() => {
    (0, utils_1.runNpmScript)('dev');
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map