import Ajv from "ajv";
const ajv = new Ajv.default({ allErrors: true, strict: false });
import chalk from 'chalk'
import { Question } from "inquirer";
import { AppParam } from "./app.config.js";

export interface CommandWithCondition {
    when?: string;
    command: string;
}
export interface PluginInquirerOption {
    name: string;
    alias?: string;
    description?: string;
    validate?: Record<string, any> | string;
    transform?: string;
    when?: string;
    inquirer?: Partial<Question>;
}
export interface PluginConfigVariable extends PluginInquirerOption {
    type: AppParam['type'];
    default?: string | number | boolean;
    configurable: boolean;
    skipEnvSave?: boolean;
}
export interface PluginGeneratorArg extends PluginInquirerOption {
    saveEnv?: boolean;
    type?: AppParam['type'];
}

export interface PrismaScript {
    description: string;
    command: string;
    when?: string;
}
export interface PluginGenerator {
    name: string;
    description?: string;
    files: Array<PluginFileMapping>;
    args?: Array<PluginGeneratorArg>;
    fileModifications?: Array<PluginFileModification>;
    postMessages?: Array<string>;
    preMessages?: Array<string>;
    afterGenerate?: CommandWithCondition;
    requiredPackages?: Array<string>;
    dependencies?: Array<string>;
    requiredPaths?: Array<string>;
    prismaScripts?: PrismaScript[];
}

export interface PluginRegistration {
    pluginImportName: string;
    pluginArgs?: string;
    imports?: string[];
}


export interface PluginFileMapping {
    source: string;
    destination: string;
    overwrite?: boolean;
    isHandlebarsTemplate?: boolean;
    isRoot?: boolean;
}

export interface PluginFileModification {
    path: string;
    mode: "prepend" | "append";
    content: string;
    match: string;
    expected?: boolean;
    isHandlebarsTemplate?: boolean;
    when?: string;
}

export interface PluginMetadata {
    name: string;
    description?: string;
    registration?: PluginRegistration;
    variables?: Array<PluginConfigVariable>;
    files?: Array<PluginFileMapping>;
    generators?: Array<PluginGenerator>;
    provideScripts?: Record<string, string>;
    postInstall?: string;
    afterInstall?: CommandWithCondition;
    postMessages?: Array<string>;
    preMessages?: Array<string>;
    postFileModifications?: Array<PluginFileModification>;
    requiredPackages?: Array<string>;
    requiredPaths?: Array<string>;
    prisma?: {
        required: boolean;
        scripts?: Array<PrismaScript>;
    }
}

const pluginConfigSchema = {
    type: "object",
    properties: {
        registration: {
            type: "object",
            properties: {
                pluginImportName: { type: "string", minLength: 1 },
                pluginArgs: { type: "string", nullable: true },
                imports: { type: "array", items: { type: "string", minLength: 1 } }
            },
            required: ["pluginImportName"],
            additionalProperties: false
        },
        name: { type: "string", minLength: 1 },
        description: { type: "string", nullable: true },
        variables: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 1 },
                    type: { type: "string", minLength: 1 },
                    default: {
                        type: ["string", "number", "boolean", "null"],
                        nullable: true
                    },
                    configurable: { type: "boolean" },
                    skipEnvSave: { type: "boolean", nullable: true },
                    description: { type: "string", nullable: true },
                    validate: {
                        type: ["object", "string", "null"],
                        additionalProperties: true
                    },
                    alias: { type: "string", nullable: true },
                    transform: { type: "string", nullable: true },
                    when: { type: "string", nullable: true },
                    inquirer: { type: "object", nullable: true }
                },
                required: ["name", "type", "configurable"],
                additionalProperties: false
            },
            nullable: true
        },
        files: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    source: { type: "string", minLength: 1 },
                    destination: { type: "string", minLength: 1 },
                    overwrite: { type: "boolean", nullable: true },
                    isHandlebarsTemplate: { type: "boolean", nullable: true },
                    isRoot: { type: "boolean", nullable: true },
                },
                required: ["source", "destination"],
                additionalProperties: false
            },
            nullable: true
        },
        generators: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 1 },
                    description: { type: "string", nullable: true },
                    files: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                source: { type: "string", minLength: 1 },
                                destination: { type: "string", minLength: 1 },
                                overwrite: { type: "boolean", nullable: true },
                                isHandlebarsTemplate: { type: "boolean", nullable: true },
                                isRoot: { type: "boolean", nullable: true }
                            },
                            required: ["source", "destination"],
                            additionalProperties: false
                        }
                    },
                    args: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                alias: { type: "string", nullable: true },
                                name: { type: "string", minLength: 1 },
                                description: { type: "string", nullable: true },
                                saveEnv: { type: "boolean", nullable: true },
                                type: { type: "string", nullable: true },
                                validate: {
                                    type: ["object", "string", "null"],
                                    additionalProperties: true
                                },
                                transform: { type: "string", nullable: true },
                                when: { type: "string", nullable: true },
                                inquirer: { type: "object", nullable: true }
                            },
                            required: ["name"],
                            additionalProperties: false
                        },
                        nullable: true
                    },
                    fileModifications: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                path: { type: "string", minLength: 1 },
                                mode: {
                                    type: "string",
                                    enum: ["prepend", "append"]
                                },
                                content: { type: "string", minLength: 1 },
                                match: { type: "string", minLength: 1 },
                                expected: { type: "boolean", nullable: true },
                                isHandlebarsTemplate: { type: "boolean", nullable: true },
                                when: { type: "string", nullable: true }
                            },
                            required: ["path", "mode", "content", "match"],
                            additionalProperties: false
                        },
                        nullable: true
                    },
                    postMessages: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                        nullable: true
                    },
                    preMessages: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                        nullable: true
                    },
                    afterGenerate: {
                        type: "object",
                        properties: {
                            when: { type: "string", nullable: true },
                            command: { type: "string", minLength: 1 }
                        },
                        required: ["command"],
                        nullable: true
                    },
                    requiredPackages: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                        nullable: true
                    },
                    dependencies: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                        nullable: true
                    },
                    requiredPaths: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                        nullable: true
                    },
                    prismaScripts: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                command: { type: "string", minLength: 1 },
                                description: { type: "string", minLength: 1 },
                                when: { type: "string", nullable: true }
                            },
                            required: ["command", "description"],
                            additionalProperties: false
                        },
                        nullable: true
                    }
                },
                required: ["name", "files"],
                additionalProperties: false
            },
            nullable: true
        },
        postInstall: {
            type: "string",
            minLength: 1,
            nullable: true
        },
        afterInstall: {
            type: "object",
            properties: {
                when: { type: "string", nullable: true },
                command: { type: "string", minLength: 1 }
            },
            required: ["command"],
            nullable: true
        },
        provideScripts: {
            type: "object",
            additionalProperties: { type: "string" },
            nullable: true
        },
        postMessages: {
            type: "array",
            items: { type: "string", minLength: 1 },
            nullable: true
        },
        preMessages: {
            type: "array",
            items: { type: "string", minLength: 1 },
            nullable: true
        },
        postFileModifications: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    path: { type: "string", minLength: 1 },
                    mode: {
                        type: "string",
                        enum: ["prepend", "append"]
                    },
                    content: { type: "string", minLength: 1 },
                    match: { type: "string", minLength: 1 },
                    expected: { type: "boolean", nullable: true },
                    isHandlebarsTemplate: { type: "boolean", nullable: true },
                    when: { type: "string", nullable: true }
                },
                required: ["path", "mode", "content", "match"],
                additionalProperties: false
            },
            nullable: true
        },
        requiredPackages: {
            type: "array",
            items: { type: "string", minLength: 1 },
            nullable: true
        },
        requiredPaths: {
            type: "array",
            items: { type: "string", minLength: 1 },
            nullable: true
        },
        prisma: {
            type: "object",
            properties: {
                required: { type: "boolean" },
                scripts: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            command: { type: "string", minLength: 1 },
                            description: { type: "string", minLength: 1 },
                            when: { type: "string", nullable: true }
                        },
                        required: ["command", "description"],
                        additionalProperties: false
                    }
                }
            },
            required: ["required"],
            additionalProperties: false
        }
    },
    required: ["name"],
    additionalProperties: false
};

export function validatePluginConfig(config: PluginMetadata): boolean {
    try {

        const validate = ajv.compile(pluginConfigSchema);
        const isValid = validate(config);

        if (!isValid) {

            console.log(chalk.red("\n❌ Plugin configuration validation errors:\n"));

            for (const error of validate.errors || []) {
                console.log(` ${chalk.yellow("⚠")} ${chalk.bold(error.instancePath || "(root)")}: ${chalk.red(error.message || "Error")}`);
            }

            console.log("\nPlease fix the errors and try again.\n");
            return false;
        }

        //console.log(chalk.green("✅ Plugin configuration is valid."));
        return true;
    } catch (error) {
        console.log(error)
        console.error(chalk.red(`Error while validating plugin configuration: ${error.message}`));
        return false;
    }
}

