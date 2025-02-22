#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const initProject_1 = require("./commands/initProject");
const config_1 = require("./config");
const plugins_1 = require("./utils/plugins");
const generate_1 = require("./utils/generate");
const qs_1 = __importDefault(require("qs"));
const setup_plugin_1 = require("./utils/setup-plugin");
const npm_1 = require("./utils/npm");
commander_1.program.name('tsdiapi').description('CLI for managing TSDIAPI projects').version(config_1.CurrentVersion);
commander_1.program.command('init <name>').description('Initialize a new TSDIAPI project')
    .option('-s, --skip', 'Skip all questions and use default settings')
    .action((name, options) => {
    (0, initProject_1.initProject)(name, {
        name: name,
        skipAll: options.skip || false
    });
});
commander_1.program.command('start <name>').description('Initialize and Fast start a new TSDIAPI project')
    .action((name) => {
    (0, initProject_1.initProject)(name, {
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
    (0, plugins_1.addPlugin)(pluginName);
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
    (0, plugins_1.updatePlugin)(pluginName);
});
commander_1.program
    .command('generate <pluginName> [generatorName] [options]')
    .description('Generate files using a specific plugin')
    .action(async (pluginName, generatorName, _options) => {
    let options = {};
    if (_options) {
        if (_options?.includes('=')) {
            options = qs_1.default.parse(_options, { delimiter: ';' });
            try {
                for (const key in options) {
                    options[key] = JSON.parse(options[key]);
                }
            }
            catch (e) { }
        }
        else {
            options['name'] = _options;
        }
    }
    (0, generate_1.generate)(pluginName, generatorName, options);
});
commander_1.program.command('build').description('Build the project').action(() => {
    (0, npm_1.runNpmScript)('build');
});
commander_1.program.command('dev').description('Run the project in development mode').action(() => {
    (0, npm_1.runNpmScript)('dev');
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map