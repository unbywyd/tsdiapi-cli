export const CurrentVersion = '0.0.1-alpha'
export const DefaultPort = 3100
export const DefaultHost = 'localhost'

export const getPackageName = (plugin: string) => {
    if (plugin.startsWith('@tsdiapi')) return plugin;
    if (plugin.startsWith('tsdiapi')) return `@${plugin}`;
    if (plugin.startsWith('@')) return plugin;
    return `@tsdiapi/${plugin}`;
}

export const getPackageVersion = (name: string) => {
    return "^" + CurrentVersion;
}
