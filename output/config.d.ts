export declare const CurrentVersion = "0.0.1-alpha";
export declare const DefaultPort = 3100;
export declare const DefaultHost = "localhost";
export declare const RegisteredPlugins: {
    prisma: string;
    'socket.io': string;
    cron: string;
    events: string;
    s3: string;
    'jwt-auth': string;
    inforu: string;
    email: string;
};
export declare const AvailablePlugins: Array<PluginName>;
export declare const getPackageName: (plugin: PluginName) => string;
export declare const getPackageVersion: (name: PluginName) => string;
export type PluginName = keyof typeof RegisteredPlugins;
export declare const IsDev = false;
//# sourceMappingURL=config.d.ts.map