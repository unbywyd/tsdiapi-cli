"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePluginConfig = validatePluginConfig;
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default({ allErrors: true, strict: false });
const chalk_1 = __importDefault(require("chalk"));
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
                                expected: { type: "boolean", nullable: true }
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
                    afterGenerate: { type: "string", nullable: true },
                    requiredPackages: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                        nullable: true
                    },
                    requiredPaths: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
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
        }
    },
    required: ["name"],
    additionalProperties: false
};
function validatePluginConfig(config) {
    try {
        const validate = ajv.compile(pluginConfigSchema);
        const isValid = validate(config);
        if (!isValid) {
            console.log(chalk_1.default.red("\n❌ Plugin configuration validation errors:\n"));
            for (const error of validate.errors || []) {
                console.log(` ${chalk_1.default.yellow("⚠")} ${chalk_1.default.bold(error.instancePath || "(root)")}: ${chalk_1.default.red(error.message || "Error")}`);
            }
            console.log("\nPlease fix the errors and try again.\n");
            return false;
        }
        console.log(chalk_1.default.green("✅ Plugin configuration is valid."));
        return true;
    }
    catch (error) {
        console.log(error);
        console.error(chalk_1.default.red(`Error while validating plugin configuration: ${error.message}`));
        return false;
    }
}
//# sourceMappingURL=plugins-configuration.js.map