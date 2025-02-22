"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageVersion = exports.getPackageName = exports.DefaultHost = exports.DefaultPort = exports.CurrentVersion = void 0;
exports.CurrentVersion = '0.0.1-alpha';
exports.DefaultPort = 3100;
exports.DefaultHost = 'localhost';
const getPackageName = (plugin) => {
    if (plugin.startsWith('@tsdiapi'))
        return plugin;
    if (plugin.startsWith('tsdiapi'))
        return `@${plugin}`;
    if (plugin.startsWith('@'))
        return plugin;
    return `@tsdiapi/${plugin}`;
};
exports.getPackageName = getPackageName;
const getPackageVersion = (name) => {
    return "^" + exports.CurrentVersion;
};
exports.getPackageVersion = getPackageVersion;
//# sourceMappingURL=config.js.map