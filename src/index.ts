#!/usr/bin/env node
import { program } from 'commander'
import { initProject } from './commands/initProject'
import { CurrentVersion } from './config'
import { addPlugin, updatePlugin } from './utils/plugins'
import { generate } from './utils/generate'
import qs from 'qs'
import { toSetupPlugin } from './utils/setup-plugin'
import { runNpmScript } from './utils/npm'
import { promptPluginDetails } from './utils/dev-plugin'

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
  .description('Manage plugins in your TSDIAPI project');

pluginCommand
  .command('add <pluginName>')
  .description('Add a plugin to your TSDIAPI project')
  .action((pluginName) => {
    addPlugin(pluginName);
  });

pluginCommand
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
  }
  );



program
  .command('generate <pluginName> [generatorName] [options]')
  .description('Generate files using a specific plugin')
  .action(async (pluginName, generatorName, _options) => {
    let options: Record<any, any> = {};
    if (_options) {
      if (_options?.includes('=')) {
        options = qs.parse(_options, { delimiter: ';' });
        try {
          for (const key in options) {
            options[key] = JSON.parse(options[key]);
          }
        } catch (e) { }
      } else {
        options['name'] = _options
      }
    }
    generate(pluginName, generatorName, options);
  });


program.parse(process.argv)

