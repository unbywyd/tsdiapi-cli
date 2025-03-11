#!/usr/bin/env node
import { program } from 'commander';
import { initProject } from './commands/init-project.js';
import { CurrentVersion } from './config.js';
import { generate } from './commands/generate.js';
import { toSetupPlugin } from './utils/setup-plugin.js';
import { promptPluginDetails } from './commands/dev-create-plg.js';
import { addPlugin } from './commands/add-plugin.js';
import { updatePlugin } from './commands/update-plugin.js';
import { checkPluginConfig } from './commands/check-plugin-config.js';
program.name('tsdiapi').description('CLI for managing TSDIAPI projects').version(CurrentVersion);
program.command('init [name]').description('Initialize a new TSDIAPI project')
    .option('-s, --skip', 'Skip all questions and use default settings')
    .action((name, options) => {
    initProject(name || '.', {
        skipAll: options.skip || false
    });
});
program.command('create <name>').description('Initialize a new TSDIAPI project')
    .option('-s, --skip', 'Skip all questions and use default settings')
    .action((name, options) => {
    initProject(name, {
        name: name,
        skipAll: options.skip || false
    });
});
program.command('start <name>').description('Initialize and Fast start a new TSDIAPI project')
    .action((name) => {
    initProject(name, {
        name: name,
        skipAll: true,
        startMode: true
    });
});
const pluginCommand = program
    .command('plugins')
    .alias('plg')
    .description('Manage plugins in your TSDIAPI project');
pluginCommand
    .command('add <pluginName>')
    .description('Add a plugin to your TSDIAPI project')
    .action((pluginName) => {
    addPlugin(pluginName);
});
program.command('add <pluginName>').description('Add a plugin to your TSDIAPI project')
    .action((pluginName) => {
    addPlugin(pluginName);
});
pluginCommand
    .command('config <pluginName>')
    .description('Configure a plugin in your TSDIAPI project')
    .action((pluginName) => {
    toSetupPlugin(pluginName);
});
program
    .command('config <pluginName>')
    .description('Configure a plugin in your TSDIAPI project')
    .action((pluginName) => {
    toSetupPlugin(pluginName);
});
pluginCommand
    .command('update <pluginName>')
    .description('Update an existing plugin in your TSDIAPI project')
    .action((pluginName) => {
    updatePlugin(pluginName);
});
const devCommand = program
    .command('dev')
    .description('Development commands');
devCommand
    .command('plugin <name>')
    .description('Create a new plugin')
    .action((name) => {
    promptPluginDetails(name);
});
devCommand
    .command('check')
    .description('Check if the config of plugin is valid')
    .action(() => {
    checkPluginConfig();
});
program
    .command('generate <pluginArg> <name>')
    .description('Generate files using a specific plugin')
    .action(async (pluginArg, name) => {
    let [pluginName, generatorName] = pluginArg.split(':')?.map((x) => x.trim());
    generate(pluginName, name, generatorName);
});
program
    .command('prisma')
    .description('Add prisma to your project')
    .action(async () => {
    addPlugin("prisma");
});
program
    .command('feature <name>')
    .description('Generate a new feature')
    .action(async (name) => {
    generate("feature", name);
});
program
    .command('service <name> [feature]')
    .description('Generate a new service')
    .action(async (name, feature) => {
    generate("service", name, "", feature);
});
program
    .command('controller <name> [feature]')
    .description('Generate a new controller')
    .action(async (name, feature) => {
    generate("controller", name, "", feature);
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map