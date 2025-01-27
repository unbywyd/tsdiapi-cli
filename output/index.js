#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const initProject_1 = require("./commands/initProject");
const config_1 = require("./config");
commander_1.program
    .name('tsdiapi')
    .description('CLI for managing TSDIAPI projects')
    .version(config_1.CurrentVersion);
commander_1.program
    .command('init')
    .description('Initialize a new TSDIAPI project')
    .action(initProject_1.initProject);
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map