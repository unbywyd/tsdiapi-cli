import { CliOptions } from '..';
export declare function startFastProject(projectname: string, options: CliOptions): Promise<void>;
export declare function initProject(projectname?: string, options?: {
    isFastMode?: boolean;
    skipAll?: boolean;
    installPrisma?: boolean;
    installSocket?: boolean;
    installCron?: boolean;
    installS3?: boolean;
    installEvents?: boolean;
    installJwt?: boolean;
    installInforu?: boolean;
    installEmail?: boolean;
}): Promise<void>;
//# sourceMappingURL=initProject.d.ts.map