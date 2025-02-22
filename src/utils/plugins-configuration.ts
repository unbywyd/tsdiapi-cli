import Ajv, { JSONSchemaType } from "ajv";
const ajv = new Ajv({ allErrors: true, strict: false });
import chalk from 'chalk'
import { Question } from "inquirer";
import { AppParam } from "./app.config";

export interface PluginInquirerOption {
    name: string;
    description?: string;
    validate?: Record<string, any> | string;
    transform?: string;
    when?: string;
    inquirer?: Partial<Question>;
}
export interface PluginGeneratorArg extends PluginInquirerOption {
}
export interface PluginGenerator {
    name: string;
    description?: string;
    files: Array<PluginFileMapping>;
    args?: Array<PluginGeneratorArg>
}
export interface PluginConfigVariable extends PluginInquirerOption {
    type: AppParam['type'];
    default?: string | number | boolean;
    configurable: boolean;
}

export interface PluginFileMapping {
    source: string;
    destination: string;
    overwrite?: boolean;
    isHandlebarsTemplate?: boolean;
}

export interface PluginFileModification {
    path: string;
    mode: "prepend" | "append";
    content: string;
    match: string;
    expected?: boolean;
}


export interface PluginMetadata {
    name: string;
    description?: string;
    variables?: Array<PluginConfigVariable>;
    files?: Array<PluginFileMapping>;
    generators?: Array<PluginGenerator>;
    provideScripts?: Record<string, string>;
    postInstall?: string;
    afterInstall?: string;
    postMessages?: Array<string>;
    postFileModifications?: Array<PluginFileModification>;
}

const pluginConfigSchema = {
    type: "object",
    properties: {
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
                    description: { type: "string", nullable: true },
                    validate: {
                        type: ["object", "string", "null"],
                        additionalProperties: true
                    },
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
                    overwrite: { type: "boolean", nullable: true }
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
                                isHandlebarsTemplate: { type: "boolean", nullable: true }
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
                                name: { type: "string", minLength: 1 },
                                description: { type: "string", nullable: true },
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
                    }
                },
                required: ["name", "files"],
                additionalProperties: false
            },
            nullable: true
        },
        postInstall: { type: "string", nullable: true },
        afterInstall: { type: "string", nullable: true },
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
                    expected: { type: "boolean", nullable: true }
                },
                required: ["path", "mode", "content", "match"],
                additionalProperties: false
            },
            nullable: true
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

        console.log(chalk.green("✅ Plugin configuration is valid."));
        return true;
    } catch (error) {
        console.log(error)
        console.error(chalk.red(`Error while validating plugin configuration: ${error.message}`));
        return false;
    }
}
