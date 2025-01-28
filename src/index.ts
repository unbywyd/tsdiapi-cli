#!/usr/bin/env node
import { program } from 'commander';
import { initProject } from './commands/initProject';
import { CurrentVersion } from './config';

program
    .name('tsdiapi')
    .description('CLI for managing TSDIAPI projects')
    .version(CurrentVersion);

program
    .command('init')
    .description('Initialize a new TSDIAPI project')
    .action(initProject);



program.parse(process.argv);