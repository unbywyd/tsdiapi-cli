#!/usr/bin/env node
import { program } from 'commander'
import { initProject } from './commands/initProject'
import { CurrentVersion } from './config'
import { addPlugin } from './utils/addPlugin'

program.name('tsdiapi').description('CLI for managing TSDIAPI projects').version(CurrentVersion)

program.command('init').description('Initialize a new TSDIAPI project').action(initProject)

const addCommand = program.command('add').description('Add resources to your TSDIAPI project')
addCommand
  .command('plugin [pluginName]')
  .description('Add a plugin to your TSDIAPI project')
  .action(addPlugin)

program.parse(process.argv)
