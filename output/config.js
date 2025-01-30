"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsDev = exports.getPackageVersion = exports.getPackageName = exports.AvailablePlugins = exports.RegisteredPlugins = exports.DefaultHost = exports.DefaultPort = exports.CurrentVersion = void 0;
exports.CurrentVersion = '1.0.0';
exports.DefaultPort = 3100;
exports.DefaultHost = 'localhost';
exports.RegisteredPlugins = {
    'prisma': '@tsdiapi/prisma',
    'socket.io': '@tsdiapi/socket.io',
    'cron': '@tsdiapi/cron',
    'events': '@tsdiapi/events',
    's3': '@tsdiapi/s3',
    'jwt-auth': '@tsdiapi/jwt-auth',
    'inforu': '@tsdiapi/inforu',
    "email": "@tsdiapi/email"
};
exports.AvailablePlugins = Object.keys(exports.RegisteredPlugins);
const getPackageName = (plugin) => {
    return exports.RegisteredPlugins[plugin];
};
exports.getPackageName = getPackageName;
const getPackageVersion = (name) => {
    return exports.IsDev ? "github:unbywyd/" + (0, exports.getPackageName)(name) + "#master" : "^" + exports.CurrentVersion;
};
exports.getPackageVersion = getPackageVersion;
exports.IsDev = false;
//# sourceMappingURL=config.js.map