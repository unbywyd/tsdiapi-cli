export declare function initProject(): Promise<void>;
export type CliOptions = {
    name: string;
    installPrisma: boolean;
    installSocket: boolean;
    installCron: boolean;
    installInforu: boolean;
    installEvents: boolean;
    installS3: boolean;
    installJwt: boolean;
    installEmail: boolean;
    port?: number;
    host?: string;
};
//# sourceMappingURL=initProject.d.ts.map