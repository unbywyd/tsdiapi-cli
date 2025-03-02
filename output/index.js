#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_project_1 = require("./commands/init-project");
const config_1 = require("./config");
const generate_1 = require("./commands/generate");
const setup_plugin_1 = require("./utils/setup-plugin");
const dev_create_plg_1 = require("./commands/dev-create-plg");
const add_plugin_1 = require("./commands/add-plugin");
const update_plg_1 = require("./commands/update-plg");
const check_plg_config_1 = require("./commands/check-plg-config");
commander_1.program.name('tsdiapi').description('CLI for managing TSDIAPI projects').version(config_1.CurrentVersion);
commander_1.program.command('init [name]').description('Initialize a new TSDIAPI project')
    .option('-s, --skip', 'Skip all questions and use default settings')
    .action((name, options) => {
    (0, init_project_1.initProject)(name || '.', {
        skipAll: options.skip || false
    });
});
commander_1.program.command('create <name>').description('Initialize a new TSDIAPI project')
    .option('-s, --skip', 'Skip all questions and use default settings')
    .action((name, options) => {
    (0, init_project_1.initProject)(name, {
        name: name,
        skipAll: options.skip || false
    });
});
commander_1.program.command('start <name>').description('Initialize and Fast start a new TSDIAPI project')
    .action((name) => {
    (0, init_project_1.initProject)(name, {
        name: name,
        skipAll: true,
        startMode: true
    });
});
const pluginCommand = commander_1.program
    .command('plugins')
    .description('Manage plugins in your TSDIAPI project');
pluginCommand
    .command('add <pluginName>')
    .description('Add a plugin to your TSDIAPI project')
    .action((pluginName) => {
    (0, add_plugin_1.addPlugin)(pluginName);
});
pluginCommand
    .command('config <pluginName>')
    .description('Configure a plugin in your TSDIAPI project')
    .action((pluginName) => {
    (0, setup_plugin_1.toSetupPlugin)(pluginName);
});
pluginCommand
    .command('update <pluginName>')
    .description('Update an existing plugin in your TSDIAPI project')
    .action((pluginName) => {
    (0, update_plg_1.updatePlugin)(pluginName);
});
const devCommand = commander_1.program
    .command('dev')
    .description('Development commands');
devCommand
    .command('plugin <name>')
    .description('Create a new plugin')
    .action((name) => {
    (0, dev_create_plg_1.promptPluginDetails)(name);
});
devCommand
    .command('check')
    .description('Check if the config of plugin is valid')
    .action(() => {
    (0, check_plg_config_1.checkPluginConfig)();
});
commander_1.program
    .command('generate <pluginArg> <name>')
    .description('Generate files using a specific plugin')
    .action(async (pluginArg, name) => {
    const [pluginName, generatorName] = pluginArg.split(':')?.map((x) => x.trim());
    (0, generate_1.generate)(pluginName, name, generatorName);
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map