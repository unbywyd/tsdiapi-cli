type CreateProjectOptions = {
    name?: string;
    host?: string;
    port?: number;
    startMode?: boolean;
    skipAll?: boolean;
};
export declare function startFastProject(projectDir: string): Promise<void>;
export declare function initProject(_installpath: string, options: CreateProjectOptions): Promise<undefined>;
export declare function installation(projectDir: string, options: CreateProjectOptions): Promise<void>;
export {};
//# sourceMappingURL=init-project.d.ts.map