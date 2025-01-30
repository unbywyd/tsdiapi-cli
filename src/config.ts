export const CurrentVersion = '0.0.1-alpha'
export const DefaultPort = 3100
export const DefaultHost = 'localhost'

export const RegisteredPlugins = {
    'prisma': '@tsdiapi/prisma',
    'socket.io': '@tsdiapi/socket.io',
    'cron': '@tsdiapi/cron',
    'events': '@tsdiapi/events',
    's3': '@tsdiapi/s3',
    'jwt-auth': '@tsdiapi/jwt-auth',
    'inforu': '@tsdiapi/inforu',
    "email": "@tsdiapi/email"
}

export const AvailablePlugins: Array<PluginName> = Object.keys(RegisteredPlugins) as Array<PluginName>;

export const getPackageName = (plugin: PluginName) => {
    return RegisteredPlugins[plugin];
}


export const getPackageVersion = (name: PluginName) => {
    return IsDev ? "github:unbywyd/" + getPackageName(name) + "#master" : "^" + CurrentVersion;
};


export type PluginName = keyof typeof RegisteredPlugins;
export const IsDev = false;