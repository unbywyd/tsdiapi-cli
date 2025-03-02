#!/usr/bin/env node
import { program } from 'commander'
import { initProject } from './commands/init-project'
import { CurrentVersion } from './config'
import { generate } from './commands/generate'
import { toSetupPlugin } from './utils/setup-plugin'
import { promptPluginDetails } from './commands/dev-create-plg'
import { addPlugin } from './commands/add-plugin'
import { updatePlugin } from './commands/update-plg'
import { checkPluginConfig } from './commands/check-plg-config'

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

devCommand
  .command('check')
  .description('Check if the config of plugin is valid')
  .action(() => {
    checkPluginConfig();
  }
  );

program
  .command('generate <pluginArg> <name>')
  .description('Generate files using a specific plugin')
  .action(async (pluginArg, name) => {
    const [pluginName, generatorName] = pluginArg.split(':')?.map((x: any) => x.trim());
    generate(pluginName, name, generatorName);
  });


program.parse(process.argv)

