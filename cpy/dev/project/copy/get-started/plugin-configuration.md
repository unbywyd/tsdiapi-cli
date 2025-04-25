# TSDIAPI Plugin Configuration Guide

## Table of Contents
- [TSDIAPI Plugin Configuration Guide](#tsdiapi-plugin-configuration-guide)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Configuration File Structure](#configuration-file-structure)
  - [Basic Configuration](#basic-configuration)
    - [Name and Description](#name-and-description)
    - [Registration](#registration)
      - [Basic Structure](#basic-structure)
      - [Example: Prisma Plugin Registration](#example-prisma-plugin-registration)
      - [Multiple Plugins Registration](#multiple-plugins-registration)
      - [Registration Properties](#registration-properties)
      - [Best Practices for Registration](#best-practices-for-registration)
  - [Variables Configuration](#variables-configuration)
    - [Variable Types and Properties](#variable-types-and-properties)
      - [Automatic Prompt Type Determination](#automatic-prompt-type-determination)
    - [Validation Rules](#validation-rules)
      - [AJV JSON Schema Validation](#ajv-json-schema-validation)
      - [Regular Expression Validation](#regular-expression-validation)
    - [AJV Schema Validation](#ajv-schema-validation)
    - [Error Messages](#error-messages)
    - [Examples of Common Validations](#examples-of-common-validations)
    - [Transformations](#transformations)
      - [Available Transformation Methods](#available-transformation-methods)
      - [Examples of Common Use Cases](#examples-of-common-use-cases)
    - [Conditional Logic](#conditional-logic)
      - [Available Conditions and Syntax](#available-conditions-and-syntax)
      - [Variable Creation and Usage Examples](#variable-creation-and-usage-examples)
    - [Combined Usage](#combined-usage)
    - [Examples in Different Contexts](#examples-in-different-contexts)
  - [Files Configuration](#files-configuration)
    - [File Mapping](#file-mapping)
      - [Destination Path Configuration](#destination-path-configuration)
      - [Placeholder Syntax](#placeholder-syntax)
      - [Examples](#examples)
      - [Path Resolution Rules](#path-resolution-rules)
      - [Template Processing](#template-processing)
      - [Template Variables](#template-variables)
      - [Template Helpers](#template-helpers)
      - [Best Practices](#best-practices)
        - [Examples](#examples-1)
  - [Generators Configuration](#generators-configuration)
    - [Generator Structure](#generator-structure)
    - [Supported Generator Features](#supported-generator-features)
    - [Complex Generator Example](#complex-generator-example)
  - [Prisma Integration](#prisma-integration)
    - [Prisma Scripts with Conditions](#prisma-scripts-with-conditions)
      - [Basic Structure](#basic-structure-1)
      - [Prisma Script Properties](#prisma-script-properties)
      - [Common Use Cases](#common-use-cases)
      - [Best Practices](#best-practices-1)
      - [Error Handling](#error-handling)
  - [File Modifications](#file-modifications)
    - [Conditional File Modifications](#conditional-file-modifications)
  - [Generator Arguments](#generator-arguments)
    - [Advanced Argument Configuration](#advanced-argument-configuration)
    - [Available jexl Functions and Expressions](#available-jexl-functions-and-expressions)
  - [Examples](#examples-2)
    - [Basic Plugin Configuration](#basic-plugin-configuration)
    - [Generator Configuration](#generator-configuration)
    - [Complex Configuration](#complex-configuration)

## Introduction

TSDIApi plugins are configured using a JSON configuration file that defines how the plugin should behave, what resources it needs, and how it integrates with your application. This guide will walk you through all aspects of plugin configuration.

## Configuration File Structure

The basic structure of a plugin configuration file (`tsdiapi.config.json`) includes:

```json
{
  "name": "plugin-name",
  "description": "Plugin description",
  "registration": {},
  "variables": [],
  "files": [],
  "generators": [],
  "requiredPackages": [],
  "requiredPaths": [],
  "prisma": {},
  "postMessages": [],
  "preMessages": []
}
```

## Basic Configuration

### Name and Description

The `name` and `description` fields are required and provide basic information about your plugin.

```json
{
  "name": "@tsdiapi/email",
  "description": "A TSDIAPI plugin for sending emails using SendGrid or SMTP via Nodemailer."
}
```

### Registration

The `registration` field defines how the plugin should be registered in your application. This configuration determines how the plugin will be imported and initialized in your main application file.

#### Basic Structure
```json
{
  "registration": {
    "pluginImportName": "PluginName",
    "pluginArgs": "initialization arguments",
    "imports": [
      "required imports"
    ]
  }
}
```

#### Example: Prisma Plugin Registration
```json
{
  "registration": {
    "pluginImportName": "PrismaPlugin",
    "pluginArgs": "{ client: PrismaClient }",
    "imports": [
      "import { PrismaClient } from '@generated/prisma/client.js'"
    ]
  }
}
```

This configuration will generate the following code in your `main.ts`:

```typescript
import { PrismaClient } from "@generated/prisma/client.js";
import PrismaPlugin from "@tsdiapi/prisma";

createApp<ConfigType>({
    configSchema: ConfigSchema,
    plugins: [
        PrismaPlugin({ client: PrismaClient }),
    ]
});
```

#### Multiple Plugins Registration
You can register multiple plugins in your application:

```typescript
import { PrismaClient } from "@generated/prisma/client.js";
import { MediaService } from './services/media.service';
import { EmailService } from './services/email.service';
import PrismaPlugin from "@tsdiapi/prisma";
import MediaPlugin from "@tsdiapi/media";
import EmailPlugin from "@tsdiapi/email";

createApp<ConfigType>({
    configSchema: ConfigSchema,
    plugins: [
        PrismaPlugin({ client: PrismaClient }),
        MediaPlugin({ autoRegisterControllers: true }),
        EmailPlugin({ provider: 'sendgrid' })
    ]
});
```

#### Registration Properties

1. **pluginImportName** (required)
   - The name of the plugin class to be imported
   - Used as the identifier when registering the plugin

2. **pluginArgs** (optional)
   - Arguments passed to the plugin constructor
   - Can be a string or object
   - Used to configure plugin behavior

3. **imports** (optional)
   - Array of import statements required by the plugin
   - These imports will be added to your main application file
   - Can include dependencies, services, or other required modules

#### Best Practices for Registration

1. Use descriptive plugin names that reflect their functionality
2. Keep plugin arguments minimal and well-documented
3. Include all necessary imports in the imports array
4. Use consistent naming conventions across plugins
5. Document any required configuration in the plugin's README

## Variables Configuration

### Variable Types and Properties

Each variable can have the following properties:
- `name`: The variable name (required)
- `type`: The variable type (required)
- `default`: Default value
- `configurable`: Whether the variable can be configured
- `description`: Description of the variable
- `inquirer`: Configuration for the input prompt
- `validate`: Validation rules
- `transform`: Transformation rules using jexl expressions
- `when`: Conditional logic using jexl expressions

#### Automatic Prompt Type Determination

The `type` field in the `inquirer` configuration can be omitted, and it will be automatically determined based on the variable type:

```json
{
  "variables": [
    {
      "name": "PORT",
      "type": "number",           // Will automatically use "number" prompt type
      "configurable": true,
      "inquirer": {
        "message": "Enter port number:"
      }
    },
    {
      "name": "ENABLE_LOGGING",
      "type": "boolean",          // Will automatically use "confirm" prompt type
      "configurable": true,
      "inquirer": {
        "message": "Enable logging?"
      }
    },
    {
      "name": "API_KEY",
      "type": "string",           // Will automatically use "input" prompt type
      "configurable": true,
      "inquirer": {
        "message": "Enter API key:"
      }
    }
  ]
}
```

The automatic type determination follows these rules:
- `boolean` type → `confirm` prompt type
- `number` type → `number` prompt type
- `string` type → `input` prompt type

You can still explicitly specify the prompt type to override this behavior:

```json
{
  "variables": [
    {
      "name": "DATABASE_TYPE",
      "type": "string",
      "configurable": true,
      "inquirer": {
        "type": "list",           // Explicitly override to use list prompt
        "message": "Select database type:",
        "choices": ["postgresql", "mongodb"]
      }
    }
  ]
}
```

### Validation Rules

Validation is implemented using the [AJV](https://ajv.js.org/) (Another JSON Schema Validator) library. You can use either AJV JSON Schema or regular expressions for validation.

#### AJV JSON Schema Validation
```json
{
  "variables": [
    {
      "name": "API_KEY",
      "type": "string",
      "validate": {
        "type": "string",
        "minLength": 32,
        "errorMessage": "API key must be at least 32 characters long."
      }
    },
    {
      "name": "PORT",
      "type": "number",
      "validate": {
        "type": "number",
        "minimum": 1,
        "maximum": 65535,
        "errorMessage": "Port must be between 1 and 65535"
      }
    }
  ]
}
```

#### Regular Expression Validation
```json
{
  "variables": [
    {
      "name": "EMAIL",
      "type": "string",
      "validate": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"
    },
    {
      "name": "USERNAME",
      "type": "string",
      "validate": "^[a-zA-Z0-9_-]{3,16}$"
    }
  ]
}
```

### AJV Schema Validation

The validation is performed using AJV's `compile` method:
```typescript
const validate = ajv.compile(schema);
```

For more information about available validation options and schema formats, please refer to the [AJV documentation](https://ajv.js.org/).

### Error Messages

Custom error messages can be provided using the `errorMessage` property:

```json
{
  "validate": {
    "type": "string",
    "minLength": 8,
    "errorMessage": "Password must be at least 8 characters long"
  }
}
```

### Examples of Common Validations

1. **Email Validation**:
```json
{
  "validate": {
    "type": "string",
    "format": "email",
    "errorMessage": "Please enter a valid email address"
  }
}
```

2. **URL Validation**:
```json
{
  "validate": {
    "type": "string",
    "format": "uri",
    "errorMessage": "Please enter a valid URL"
  }
}
```

3. **Password Validation**:
```json
{
  "validate": {
    "type": "string",
    "minLength": 8,
    "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
    "errorMessage": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
  }
}
```

4. **Port Number Validation**:
```json
{
  "validate": {
    "type": "number",
    "minimum": 1,
    "maximum": 65535,
    "errorMessage": "Port must be between 1 and 65535"
  }
}
```

5. **Custom Regex Validation**:
```json
{
  "validate": "^[A-Z][a-zA-Z0-9]*$"
}
```

### Transformations

Transformations are performed using JEXL expressions where `x` represents the input value. The transformation is applied using the `transform` property.

#### Available Transformation Methods

The following transformation methods are available for string manipulation:

1. **Case Transformations**:
```json
{
  "transform": "capitalize(x)"    // Capitalizes first letter (e.g., "user" -> "User")
}
```
```json
{
  "transform": "camelCase(x)"     // Converts to camelCase (e.g., "user_name" -> "userName")
}
```
```json
{
  "transform": "kebabCase(x)"     // Converts to kebab-case (e.g., "userName" -> "user-name")
}
```
```json
{
  "transform": "pascalCase(x)"    // Converts to PascalCase (e.g., "user_name" -> "UserName")
}
```
```json
{
  "transform": "snakeCase(x)"     // Converts to snake_case (e.g., "userName" -> "user_name")
}
```
```json
{
  "transform": "lowerCase(x)"     // Converts to lowercase (e.g., "UserName" -> "username")
}
```
```json
{
  "transform": "upperCase(x)"     // Converts to uppercase (e.g., "userName" -> "USERNAME")
}
```

2. **String Operations**:
```json
{
  "transform": "x + '_suffix'"    // Adds suffix
}
```
```json
{
  "transform": "'prefix_' + x"    // Adds prefix
}
```
```json
{
  "transform": "x.replace('old', 'new')"  // Replaces text
}
```

3. **Mathematical Operations**:
```json
{
  "transform": "x * 2"            // Multiplies by 2
}
```
```json
{
  "transform": "x + 10"           // Adds 10
}
```
```json
{
  "transform": "x - 1"            // Subtracts 1
}
```

4. **Combined Transformations**:
```json
{
  "transform": "capitalize(x.toLowerCase())"  // First lowercase, then capitalize
}
```
```json
{
  "transform": "pascalCase(snakeCase(x))"    // First snake_case, then PascalCase
}
```

#### Examples of Common Use Cases

1. **Model Names**:
```json
{
  "transform": "pascalCase(x)"    // For class names (e.g., "user_profile" -> "UserProfile")
}
```

2. **File Names**:
```json
{
  "transform": "kebabCase(x)"     // For file names (e.g., "UserProfile" -> "user-profile")
}
```

3. **Variable Names**:
```json
{
  "transform": "camelCase(x)"     // For variable names (e.g., "user_profile" -> "userProfile")
}
```

4. **Constants**:
```json
{
  "transform": "upperCase(snakeCase(x))"  // For constants (e.g., "userProfile" -> "USER_PROFILE")
}
```

### Conditional Logic

Conditions are specified using the `when` property with JEXL expressions. The condition is evaluated against the current context, which includes variables from plugin installation and generator arguments.

#### Available Conditions and Syntax

1. **Simple Comparisons**:
```json
{
  "when": "DATABASE_TYPE == 'postgresql'"  // Exact match
}
```
```json
{
  "when": "DATABASE_TYPE != 'mongodb'"     // Not equal
}
```
```json
{
  "when": "PORT > 1024"                    // Greater than
}
```
```json
{
  "when": "PORT <= 65535"                  // Less than or equal
}
```

2. **String Operations**:
```json
{
  "when": "modelName.startsWith('User')"   // String starts with
}
```
```json
{
  "when": "modelName.endsWith('Model')"    // String ends with
}
```
```json
{
  "when": "modelName.includes('Admin')"    // String contains
}
```
```json
{
  "when": "modelName.length > 5"           // String length
}
```

3. **Logical Operations**:
```json
{
  "when": "FEATURE_TYPE == 'model' && DATABASE_TYPE == 'postgresql'"  // AND
}
```
```json
{
  "when": "AUTH_TYPE == 'jwt' || AUTH_TYPE == 'session'"              // OR
}
```
```json
{
  "when": "!(FEATURE_TYPE == 'controller')"                           // NOT
}
```

4. **Array Operations**:
```json
{
  "when": "features.includes('auth')"     // Array contains
}
```
```json
{
  "when": "features.length > 0"           // Array length
}
```

5. **Combined Conditions**:
```json
{
  "when": "(FEATURE_TYPE == 'model' && DATABASE_TYPE == 'postgresql') || (FEATURE_TYPE == 'controller' && DATABASE_TYPE == 'mongodb')"
}
```
```json
{
  "when": "isPrivate && (modelName.startsWith('Admin') || modelName.startsWith('User'))"
}
```

#### Variable Creation and Usage Examples

1. **Plugin Installation Variables**:

```json
{
  "variables": [
    {
      "name": "DATABASE_TYPE",
      "type": "string",
      "configurable": true,
      "inquirer": {
        "type": "list",
        "message": "Select database type:",
        "choices": ["postgresql", "mongodb"]
      }
    }
  ]
}
```

When installing the plugin, the user will see a prompt:
```bash
? Select database type: (Use arrow keys)
❯ postgresql
  mongodb
```

After selection, `DATABASE_TYPE` becomes available for conditions:

```json
{
  "prisma": {
    "scripts": [
      {
        "command": "ADD MODEL User ({id String @id @default(cuid())});",
        "when": "DATABASE_TYPE == 'postgresql'"  // This script will only run if user selected postgresql
      }
    ]
  }
}
```

2. **Generator Arguments**:

```json
{
  "generators": [
    {
      "name": "model",
      "args": [
        {
          "name": "modelName",
          "inquirer": {
            "type": "input",
            "message": "Enter model name"
          }
        },
        {
          "name": "isPrivate",
          "inquirer": {
            "type": "confirm",
            "message": "Is this a private model?"
          }
        }
      ]
    }
  ]
}
```

When running the generator, the user will see prompts:
```bash
? Enter model name: User
? Is this a private model? (y/N)
```

After answering, these values become available for conditions:

```json
{
  "files": [
    {
      "source": "templates/private-model.ts",
      "destination": "src/models/{{modelName}}.ts",
      "when": "isPrivate"  // This file will only be generated if user answered 'yes'
    },
    {
      "source": "templates/public-model.ts",
      "destination": "src/models/{{modelName}}.ts",
      "when": "!isPrivate"  // This file will only be generated if user answered 'no'
    }
  ]
}
```

### Combined Usage

Transformations and conditions can be combined:

```json
{
  "variables": [
    {
      "name": "MODEL_NAME",
      "type": "string",
      "transform": "capitalize(x)",
      "when": "FEATURE_TYPE == 'model'"
    },
    {
      "name": "TABLE_NAME",
      "type": "string",
      "transform": "x.toLowerCase()",
      "when": "DATABASE_TYPE == 'postgresql'"
    }
  ]
}
```

### Examples in Different Contexts

1. **In Variables**:
```json
{
  "variables": [
    {
      "name": "MODEL_NAME",
      "type": "string",
      "transform": "capitalize(x)",
      "when": "FEATURE_TYPE == 'model'"
    }
  ]
}
```

2. **In Prisma Scripts**:
```json
{
  "prisma": {
    "scripts": [
      {
        "command": "ADD MODEL User ({id String @id @default(cuid())});",
        "description": "Add User model",
        "when": "AUTH_TYPE == 'jwt'"
      }
    ]
  }
}
```

3. **In File Modifications**:
```json
{
  "fileModifications": [
    {
      "path": "src/config/database.ts",
      "mode": "append",
      "content": "export const DATABASE_URL = process.env.DATABASE_URL;",
      "match": "export const",
      "when": "DATABASE_TYPE == 'postgresql'"
    }
  ]
}
```

4. **In Generator Arguments**:
```json
{
  "generators": [
    {
      "name": "model",
      "args": [
        {
          "name": "modelName",
          "transform": "capitalize(x)",
          "when": "FEATURE_TYPE == 'model'"
        }
      ]
    }
  ]
}
```

## Files Configuration

### File Mapping

Files can be mapped from source to destination with various path configurations:

```json
{
  "files": [
    {
      "source": "files/email.hbs",
      "destination": "src/templates/email.hbs",
      "overwrite": false,
      "isHandlebarsTemplate": true
    }
  ]
}
```

#### Destination Path Configuration

The `destination` field supports several formats and placeholders:

1. **Relative Path**:
```json
{
  "destination": "src/models/User.ts"  // Creates file in src/models directory
}
```

2. **Current Directory**:
```json
{
  "destination": "."  // Creates file in current directory (relative to process.cwd() or project root if isRoot is true)
}
```

3. **Name Placeholder (Recommended)**:
```json
{
  "destination": "src/[name].ts"  // Uses the name from generator arguments in filename
}
```

4. **Template Variables (Legacy Support)**:
```json
{
  "destination": "src/{{name}}.ts"  // Legacy support for name variable in path
}
```

5. **Combined Paths**:
```json
{
  "destination": "src/models/[name]/[modelName].ts"  // Uses both generator name and model name
}
```

#### Placeholder Syntax

1. **Square Brackets `[name]` (Recommended)**:
   - Primary and recommended way to use placeholders
   - Used for both path and filename parts
   - Example: `[name].ts` → `User.ts`
   - Replaced with the generator name or argument value
   - Supports any variable name: `[modelName]`, `[featureName]`, etc.
   - More flexible and consistent with modern practices

2. **Double Curly Braces `{{name}}` (Legacy)**:
   - Legacy support for backward compatibility
   - Only `{{name}}` is supported (not any variable name)
   - Limited to replacing the `name` variable
   - Considered deprecated - use square brackets instead
   - Example: `src/{{name}}/` → `src/User/`

3. **Combined Usage (Recommended with Square Brackets)**:
```json
{
  "destination": "src/features/[featureName]/controllers/[name].ts"  // Uses square brackets for all variables
}
```

#### Examples

1. **Basic File Generation**:
```json
{
  "files": [
    {
      "source": "templates/model.ts",
      "destination": "src/models/User.ts"
    }
  ]
}
```

2. **Using Generator Arguments (Recommended)**:
```json
{
  "generators": [
    {
      "name": "model",
      "args": [
        {
          "name": "modelName",
          "inquirer": {
            "type": "input",
            "message": "Enter model name"
          }
        }
      ],
      "files": [
        {
          "source": "templates/model.ts",
          "destination": "src/models/[modelName].ts"  // Uses square brackets for model name
        }
      ]
    }
  ]
}
```

3. **Using [name] Placeholder (Recommended)**:
```json
{
  "generators": [
    {
      "name": "model",
      "files": [
        {
          "source": "templates/model.ts",
          "destination": "[name].ts"  // Uses generator name as filename
        }
      ]
    }
  ]
}
```

4. **Current Directory Generation**:
```json
{
  "files": [
    {
      "source": "templates/config.ts",
      "destination": "."  // Creates file in current directory
    }
  ]
}
```

5. **Complex Path Structure (Recommended)**:
```json
{
  "generators": [
    {
      "name": "feature",
      "args": [
        {
          "name": "featureName",
          "inquirer": {
            "type": "input",
            "message": "Enter feature name"
          }
        }
      ],
      "files": [
        {
          "source": "templates/controller.ts",
          "destination": "src/features/[featureName]/controllers/[name].ts"  // Uses square brackets for all variables
        }
      ]
    }
  ]
}
```

#### Path Resolution Rules

1. **Absolute vs Relative Paths**:
   - All paths are resolved relative to the project root
   - Use `isRoot: true` to resolve paths relative to the current directory

2. **Placeholder Replacement**:
   - `[name]` is the recommended way to use placeholders
   - Supports any variable name in square brackets
   - `{{name}}` is legacy support and should be avoided
   - Placeholders can be used in both directory and filename parts

3. **Directory Creation**:
   - All necessary directories are automatically created
   - Path separators can be either `/` or `\`

4. **File Overwriting**:
   - Use `overwrite: true` to allow overwriting existing files
   - Default is `overwrite: false`

#### Template Processing

The `isHandlebarsTemplate` property determines how the file content is processed:

1. **When `isHandlebarsTemplate: true`**:
   - File is processed as a Handlebars template
   - All variables from the context are available in the template
   - Supports Handlebars syntax: `{{variable}}`, `{{#if}}`, `{{#each}}`, etc.
   - Example:
   ```json
   {
     "files": [
       {
         "source": "templates/model.ts.hbs",
         "destination": "src/models/[name].ts",
         "isHandlebarsTemplate": true
       }
     ]
   }
   ```
   Template content (`model.ts.hbs`):
   ```typescript
   export class {{className}} {
     constructor(public name: string) {}
     
     {{#if hasMethods}}
     public getFullName(): string {
       return this.name;
     }
     {{/if}}
   }
   ```

2. **When `isHandlebarsTemplate: false` or omitted**:
   - File is copied as-is without template processing
   - Only path placeholders are replaced (`[name]`, `{{name}}`)
   - Example:
   ```json
   {
     "files": [
       {
         "source": "static/config.json",
         "destination": "src/config/[name].json",
         "isHandlebarsTemplate": false
       }
     ]
   }
   ```

#### Template Variables

When using Handlebars templates, the following variables are available:

1. **Generator Arguments**:
   - All arguments defined in the generator's `args` section
   - Example: `{{modelName}}`, `{{isPrivate}}`

2. **Built-in Variables**:
   - `name`: The generator name
   - `className`: PascalCase version of the name
   - `fileName`: KebabCase version of the name
   - `packageName`: The plugin package name

3. **Plugin Variables**:
   - All variables defined in the plugin's `variables` section
   - Example: `{{DATABASE_TYPE}}`, `{{API_KEY}}`

#### Template Helpers

Handlebars templates support the following helpers:

1. **Conditional Logic**:
   ```handlebars
   {{#if isPrivate}}
   // Private model code
   {{else}}
   // Public model code
   {{/if}}
   ```

2. **Iteration**:
   ```handlebars
   {{#each fields}}
   {{name}}: {{type}},
   {{/each}}
   ```

3. **String Transformations**:
   ```handlebars
   {{toLowerCase name}}
   {{toUpperCase name}}
   {{capitalize name}}
   ```

#### Best Practices

1. Use the actual file extension that should appear in the project
   - Example: `[basename].controller.load.ts`, `[basename].service.ts`, `[basename].tschemas.ts`
   - Don't add `.hbs` to the source file names
   - The template engine will process the content while preserving the original extension

2. Keep templates simple and focused on a single responsibility
3. Use conditional logic sparingly to maintain readability
4. Document available variables and helpers in the plugin's README
5. Test templates with different input values to ensure correct generation

##### Examples

1. **Controller Template**:
```json
{
  "files": [
    {
      "source": "templates/controller.load.ts",
      "destination": "src/controllers/[name].controller.load.ts",
      "isHandlebarsTemplate": true
    }
  ]
}
```
Template content (`templates/controller.load.ts`):
```typescript
import { AppContext } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";
import { getMetaProvider } from "@tsdiapi/meta";

export default async function register{{className}}Routes({ useRoute }: AppContext) {
    const meta = getMetaProvider();

    useRoute("{{route}}")
        .get("/list")
        .summary("Get {{className}} list")
        .code(200, Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String(),
        })))
        .handler(async () => {
            const data = await meta.get{{className}}List();
            return { status: 200, data };
        })
        .build();

    useRoute("{{route}}")
        .get("/:id")
        .summary("Get {{className}} by id")
        .params(Type.Object({ id: Type.String() }))
        .code(200, Type.Object({
            id: Type.String(),
            name: Type.String(),
        }))
        .handler(async (req) => {
            const data = await meta.get{{className}}ById(req.params.id);
            return { status: 200, data };
        })
        .build();
}
```

2. **Service Template**:
```json
{
  "files": [
    {
      "source": "templates/service.ts",
      "destination": "src/services/[name].service.ts",
      "isHandlebarsTemplate": true
    }
  ]
}
```
Template content (`templates/service.ts`):
```typescript
import { Service } from "typedi";
import { {{className}}Output, {{className}}Type } from "./{{kebabCase name}}.tschemas.js";
import type { PrismaClient } from "@generated/prisma/index.js";
import { usePrisma } from "@tsdiapi/prisma";

const model = () => {
    return usePrisma<PrismaClient>()['{{kebabCase name}}']
}

@Service()
export default class {{className}}Service {
    public async getById(id: string): Promise<{{className}}Output | null> {
        try {
            const db = model();
            if (!db) {
                console.log('{{className}} entity not found in Prisma client. Please check your Prisma schema.');
                return null;
            }
            const data = await db.findUnique({
                where: {
                    id,
                    deletedAt: null
                }
            });
            return data as {{className}}Output;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    public async getAll(): Promise<{{className}}Output[]> {
        try {
            const db = model();
            if (!db) {
                console.log('{{className}} entity not found in Prisma client. Please check your Prisma schema.');
                return [];
            }
            const data = await db.findMany({
                where: {
                    deletedAt: null
                }
            });
            return data as {{className}}Output[];
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}
```

3. **Schema Template**:
```json
{
  "files": [
    {
      "source": "templates/tschemas.ts",
      "destination": "src/schemas/[name].tschemas.ts",
      "isHandlebarsTemplate": true
    }
  ]
}
```
Template content (`templates/tschemas.ts`):
```typescript
import { Type } from "@sinclair/typebox";

export enum {{className}}Type {
    DEFAULT = "DEFAULT",
    {{#each types}}
    {{this}} = "{{this}}",
    {{/each}}
}

export const {{className}}Schema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    type: Type.Enum({{className}}Type),
    {{#each fields}}
    {{name}}: {{type}},
    {{/each}}
    createdAt: Type.String(),
    updatedAt: Type.String(),
    deletedAt: Type.Optional(Type.String())
});

export type {{className}}Output = Type.Static<typeof {{className}}Schema>;
```

4. **Controller Template**:
```json
{
  "files": [
    {
      "source": "templates/controller.load.ts",
      "destination": "src/controllers/[name].controller.load.ts",
      "isHandlebarsTemplate": true
    }
  ]
}
```
Template content (`templates/controller.load.ts`):
```typescript
import { AppContext } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";
import { {{className}}Output, {{className}}Schema } from "../schemas/{{kebabCase name}}.tschemas.js";
import { {{className}}Service } from "../services/{{kebabCase name}}.service.js";

export default async function register{{className}}Routes({ useRoute }: AppContext) {
    const service = new {{className}}Service();

    useRoute("{{kebabCase name}}")
        .get("/list")
        .summary("Get {{className}} list")
        .code(200, Type.Array({{className}}Schema))
        .handler(async () => {
            const data = await service.getAll();
            return { status: 200, data };
        })
        .build();

    useRoute("{{kebabCase name}}")
        .get("/:id")
        .summary("Get {{className}} by id")
        .params(Type.Object({ id: Type.String() }))
        .code(200, {{className}}Schema)
        .handler(async (req) => {
            const data = await service.getById(req.params.id);
            return { status: 200, data };
        })
        .build();
}
```

## Generators Configuration

### Generator Structure

Generators allow you to create new files and components in your project. A single plugin can contain multiple generators, each with its own specific functionality.

```json
{
  "generators": [
    {
      "name": "feature",
      "description": "Generate a feature folder",
      "args": [
        {
          "name": "entityName",
          "description": "Entity name",
          "inquirer": {
            "type": "input",
            "message": "Enter entity name"
          }
        }
      ],
      "files": [
        {
          "source": "generators/feature/*.*",
          "destination": "[name]",
          "isHandlebarsTemplate": true
        }
      ],
      "requiredPackages": ["@tsdiapi/server"],
      "fileModifications": [
        {
          "path": "src/main.ts",
          "mode": "append",
          "content": "import {{className}} from './features/{{kebabCase name}}';",
          "match": "import"
        }
      ],
      "postMessages": ["Feature generated successfully!"],
      "preMessages": ["Generating feature structure..."]
    }
  ]
}
```

### Supported Generator Features

1. **Generator Arguments (`args`)**:
   - Used to create an interactive questionnaire when running the generator
   - Each argument can have:
     - `name`: Variable name
     - `description`: Argument description
     - `inquirer`: Configuration for interactive input
     - `validate`: Validation rules
     - `transform`: Value transformations
     - `when`: Conditions for showing the argument
   - Example:
   ```json
   {
     "args": [
       {
         "name": "modelName",
         "description": "Name of the model",
         "inquirer": {
           "type": "input",
           "message": "Enter model name"
         },
         "validate": {
           "type": "string",
           "pattern": "^[A-Z][a-zA-Z0-9]*$"
         }
       }
     ]
   }
   ```

2. **Required Packages (`requiredPackages`)**:
   - List of packages required for the generator to work
   - Checked before generation but not installed automatically
   - Installation is the user's responsibility
   - Example:
   ```json
   {
     "requiredPackages": [
       "@tsdiapi/server",
       "@tsdiapi/prisma"
     ]
   }
   ```

3. **File Modifications (`fileModifications`)**:
   - Allows modifying existing files
   - Supports three modes:
     - `prepend`: Add to the beginning of the file
     - `append`: Add to the end of the file
     - `replace`: Replace content
   - Can use Handlebars templates
   - Supports conditional modification via `when`
   - Example:
   ```json
   {
     "fileModifications": [
       {
         "path": "src/main.ts",
         "mode": "append",
         "content": "import {{className}} from './features/{{kebabCase name}}';",
         "match": "import",
         "when": "FEATURE_TYPE == 'module'"
       }
     ]
   }
   ```

4. **Messages (`postMessages` and `preMessages`)**:
   - `preMessages`: Messages shown before generation
   - `postMessages`: Messages shown after generation
   - Used to inform the user
   - Example:
   ```json
   {
     "preMessages": ["Starting generation process..."],
     "postMessages": ["Generation completed successfully!"]
   }
   ```

5. **Generator Files (`files`)**:
   - Defines which files will be created
   - Supports Handlebars templates
   - Can use variables from arguments
   - Example:
   ```json
   {
     "files": [
       {
         "source": "templates/controller.ts",
         "destination": "src/controllers/[name].controller.ts",
         "isHandlebarsTemplate": true
       }
     ]
   }
   ```

6. **Dependencies (`dependencies`)**:
   - List of npm packages that will be automatically installed
   - Packages are installed using `npm install` before generation
   - Example:
   ```json
   {
     "dependencies": [
       "@tsdiapi/server",
       "@tsdiapi/prisma"
     ]
   }
   ```
   This will run:
   ```bash
   npm install @tsdiapi/server @tsdiapi/prisma
   ```

7. **Required Paths (`requiredPaths`)**:
   - List of paths that must exist for the generator to work
   - Checked before generation
   - Example:
   ```json
   {
     "requiredPaths": [
       "src/models",
       "src/schemas"
     ]
   }
   ```

8. **Prisma Scripts (`prismaScripts`)**:
   - Defines changes to the Prisma schema
   - Executed after file generation
   - Can be conditional via `when`
   - Example:
   ```json
   {
     "prismaScripts": [
       {
         "command": "ADD MODEL User ({id String @id @default(cuid())});",
         "when": "DATABASE_TYPE == 'postgresql'"
       }
     ]
   }
   ```

### Complex Generator Example

```json
{
  "generators": [
    {
      "name": "full-feature",
      "description": "Generate complete feature with model, schema, and controller",
      "args": [
        {
          "name": "featureName",
          "description": "Name of the feature",
          "inquirer": {
            "type": "input",
            "message": "Enter feature name"
          }
        },
        {
          "name": "isPrivate",
          "description": "Is this a private feature?",
          "inquirer": {
            "type": "confirm",
            "message": "Is this a private feature?"
          }
        }
      ],
      "requiredPackages": [
        "@tsdiapi/server",
        "@tsdiapi/prisma"
      ],
      "files": [
        {
          "source": "templates/feature.ts",
          "destination": "src/features/[featureName]/index.ts",
          "isHandlebarsTemplate": true
        }
      ],
      "fileModifications": [
        {
          "path": "src/main.ts",
          "mode": "append",
          "content": "import {{className}} from './features/{{kebabCase featureName}}';",
          "match": "import",
          "when": "!isPrivate"
        }
      ],
      "postMessages": [
        "Feature generated successfully!",
        "Don't forget to register the feature in main.ts"
      ]
    }
  ]
}
```

## Prisma Integration

### Prisma Scripts with Conditions

Prisma scripts allow you to modify your database schema during plugin installation or generator execution. These scripts are executed using the Prisma CLI and can be conditional based on user input or configuration.

#### Basic Structure
```json
{
  "prisma": {
    "required": true,
    "scripts": [
      {
        "command": "ADD MODEL User ({id String @id @default(cuid())});",
        "description": "Add User model",
        "when": "AUTH_TYPE == 'jwt'"
      }
    ]
  }
}
```

#### Prisma Script Properties

1. **Command**:
   - The actual Prisma CLI command to execute
   - Can include model definitions, relations, and other schema modifications
   - Example:
   ```json
   {
     "command": "ADD MODEL User ({id String @id @default(cuid()) name String email String @unique});"
   }
   ```

2. **Description**:
   - Human-readable description of what the script does
   - Used in logs and user feedback
   - Example:
   ```json
   {
     "description": "Add User model with authentication fields"
   }
   ```

3. **When Condition**:
   - JEXL expression that determines if the script should run
   - Can reference variables from plugin installation or generator arguments
   - Example:
   ```json
   {
     "when": "DATABASE_TYPE == 'postgresql' && AUTH_TYPE == 'jwt'"
   }
   ```

#### Common Use Cases

1. **Adding Models**:
```json
{
  "prisma": {
    "scripts": [
      {
        "command": "ADD MODEL User ({id String @id @default(cuid()) name String email String @unique});",
        "description": "Add User model"
      }
    ]
  }
}
```

2. **Adding Relations**:
```json
{
  "prisma": {
    "scripts": [
      {
        "command": "ADD RELATION User.posts Post.user;",
        "description": "Add relation between User and Post models"
      }
    ]
  }
}
```

3. **Adding Enums**:
```json
{
  "prisma": {
    "scripts": [
      {
        "command": "ADD ENUM UserRole {ADMIN USER GUEST};",
        "description": "Add UserRole enum"
      }
    ]
  }
}
```

4. **Conditional Schema Modifications**:
```json
{
  "prisma": {
    "scripts": [
      {
        "command": "ADD MODEL Session ({id String @id @default(cuid()) userId String});",
        "description": "Add Session model for session-based auth",
        "when": "AUTH_TYPE == 'session'"
      },
      {
        "command": "ADD MODEL Token ({id String @id @default(cuid()) userId String});",
        "description": "Add Token model for JWT auth",
        "when": "AUTH_TYPE == 'jwt'"
      }
    ]
  }
}
```

#### Best Practices

1. **Keep Scripts Atomic**:
   - Each script should perform a single, well-defined operation
   - Makes it easier to track changes and handle errors

2. **Use Descriptive Names**:
   - Choose clear, descriptive names for models and fields
   - Follow consistent naming conventions

3. **Handle Dependencies**:
   - Order scripts to handle dependencies correctly
   - Create models before adding relations

4. **Use Conditions Wisely**:
   - Use `when` conditions to make scripts flexible
   - Consider all possible scenarios

5. **Document Changes**:
   - Provide clear descriptions for each script
   - Document any dependencies or prerequisites

#### Error Handling

The configuration system handles errors in the following ways:

1. **Validation Errors**:
   - Invalid configuration is rejected
   - Detailed error messages are provided
   - Line numbers and paths are included

2. **Runtime Errors**:
   - File operations are wrapped in try-catch
   - Prisma commands are validated before execution
   - Generator execution is atomic

3. **User Feedback**:
   - Clear error messages
   - Suggested fixes
   - Context information

## File Modifications

### Conditional File Modifications

File modifications can be conditionally applied using jexl expressions:

```json
{
  "fileModifications": [
    {
      "path": "src/config/database.ts",
      "mode": "append",
      "content": "export const DATABASE_URL = process.env.DATABASE_URL;",
      "match": "export const",
      "when": "DATABASE_TYPE == 'postgresql'"
    },
    {
      "path": "src/config/auth.ts",
      "mode": "prepend",
      "content": "import { JwtStrategy } from './strategies/jwt.strategy';",
      "match": "import",
      "when": "AUTH_TYPE == 'jwt'"
    }
  ]
}
```

## Generator Arguments

### Advanced Argument Configuration

Generator arguments can include validation, transformation, and conditional logic:

```json
{
  "generators": [
    {
      "name": "model",
      "args": [
        {
          "name": "modelName",
          "description": "Model name",
          "inquirer": {
            "type": "input",
            "message": "Enter model name"
          },
          "validate": {
            "type": "string",
            "pattern": "^[A-Z][a-zA-Z0-9]*$",
            "errorMessage": "Model name must start with uppercase letter"
          },
          "transform": "capitalize(x)",
          "when": "FEATURE_TYPE == 'model'"
        },
        {
          "name": "tableName",
          "description": "Database table name",
          "inquirer": {
            "type": "input",
            "message": "Enter table name"
          },
          "transform": "x.toLowerCase()",
          "when": "DATABASE_TYPE == 'postgresql'"
        }
      ]
    }
  ]
}
```

### Available jexl Functions and Expressions

1. **String Transformations**:
   - `capitalize(x)`: Capitalizes first letter
   - `x.toLowerCase()`: Converts to lowercase
   - `x.toUpperCase()`: Converts to uppercase

2. **Conditional Expressions**:
   - `FEATURE_TYPE == 'model'`
   - `DATABASE_TYPE == 'postgresql'`
   - `AUTH_TYPE == 'jwt'`
   - `!isPrivate`
   - `size > 100`

3. **Mathematical Operations**:
   - `x * 2`
   - `size + 10`
   - `count - 1`

4. **Logical Operations**:
   - `&&` (AND)
   - `||` (OR)
   - `!` (NOT)

5. **String Operations**:
   - `x + '_suffix'`
   - `'prefix_' + x`
   - `x.replace('old', 'new')`

## Examples

### Basic Plugin Configuration

```json
{
  "name": "@tsdiapi/email",
  "description": "Email plugin",
  "variables": [
    {
      "name": "EMAIL_PROVIDER",
      "type": "string",
      "default": "sendgrid",
      "configurable": true,
      "description": "Email provider",
      "inquirer": {
        "type": "list",
        "message": "Select provider:",
        "choices": ["sendgrid", "nodemailer"]
      }
    }
  ]
}
```

### Generator Configuration

```json
{
  "generators": [
    {
      "name": "controller",
      "description": "Generate controller",
      "files": [
        {
          "source": "generators/controller/*.*",
          "destination": ".",
          "isHandlebarsTemplate": true
        }
      ],
      "args": [
        {
          "name": "modelName",
          "description": "Model name",
          "inquirer": {
            "type": "input",
            "message": "Enter model name"
          }
        }
      ]
    }
  ]
}
```

### Complex Configuration

```json
{
  "name": "@tsdiapi/media",
  "description": "Media plugin",
  "variables": [
    {
      "name": "MEDIA_PREVIEW_SIZE",
      "type": "number",
      "default": 512,
      "configurable": true,
      "description": "Preview size"
    }
  ],
  "files": [
    {
      "source": "files/media/*.*",
      "destination": ".",
      "overwrite": false,
      "isHandlebarsTemplate": true
    }
  ],

  "generators": [
    {
      "name": "media",
      "description": "Generate media management components",
      "args": [
        {
          "name": "modelName",
          "description": "Name of the media model",
          "inquirer": {
            "type": "input",
            "message": "Enter model name:"
          },
          "validate": {
            "type": "string",
            "pattern": "^[A-Z][a-zA-Z0-9]*$",
            "errorMessage": "Model name must start with uppercase letter"
          },
          "transform": "capitalize(x)"
        }
      ],
      "files": [
        {
          "source": "generators/feature/*.*",
          "destination": "src/[name]",
          "overwrite": false,
          "isRoot": true,
          "isHandlebarsTemplate": true
        }
      ],
      "fileModifications": [
        {
          "path": "src/main.ts",
          "mode": "append",
          "content": "import {{className}}Controller from './controllers/{{kebabCase name}}.controller';",
          "match": "import",
          "when": "!isPrivate"
        }
      ],
      "prisma": {
        "required": true,
        "scripts": [
          {
            "command": "ADD ENUM {{className}}Type ({IMAGE|VIDEO|DOCUMENT|OTHER});",
            "description": "Add {{className}}Type enum"
          },
          {
            "command": "ADD MODEL {{className}} ({id String @id @default(cuid())|name String?|type {{className}}Type @default(OTHER)|width Float?|height Float?|mimetype String?|filesize Float?|url String|key String?|s3bucket String?|s3region String?});",
            "description": "Add {{className}} model"
          },
          {
            "command": "ADD RELATION {{className}} AND User (type=1:1, pivotTable={{className}}User);",
            "description": "Add relation between {{className}} and User"
          },
          {
            "command": "ADD RELATION {{className}} AND {{className}} (type=1:M);",
            "description": "Add relation between {{className}} and {{className}} (for previews)",
            "when": "hasPreview"
          }
        ]
      },
      "requiredPackages": [
        "@tsdiapi/server",
        "@aws-sdk/client-s3"
      ],
      "requiredPaths": [
        "src/models",
        "src/controllers"
      ],
      "postMessages": [
        "Media components generated successfully!",
        "Don't forget to configure your storage provider in config files."
      ],
      "preMessages": [
        "Generating media management components...",
        "This will create models, controllers, and services."
      ]
    }
  ],

  "requiredPackages": [
    "@tsdiapi/server",
    "@aws-sdk/client-s3",
    "sharp"
  ],

  "requiredPaths": [
    "src/config",
    "src/services"
  ],

  "prisma": {
    "required": true,
    "scripts": [
      {
        "command": "ADD ENUM MediaType ({IMAGE|VIDEO|DOCUMENT|OTHER});",
        "description": "Add MediaType enum"
      },
      {
        "command": "ADD MODEL Media ({id String @id @default(cuid())|name String?|isPrivate Boolean @default(false)|format String?|type MediaType @default(OTHER)|width Float?|height Float?|mimetype String?|filesize Float?|url String|key String?|s3bucket String?|s3region String?});",
        "description": "Add Media model"
      },
      {
        "command": "ADD MODEL User ({id String @id @default(cuid())|email String? @unique|phoneNumber String? @unique});",
        "description": "Add User model to Prisma schema"
      },
      {
        "command": "ADD RELATION Media AND User (type=1:1, pivotTable=UserMedia);",
        "description": "Add relation between Media and User"
      },
      {
        "command": "ADD RELATION Media AND Media (type=1:M);",
        "description": "Add relation between Media and Media (for previews)"
      }
    ]
  },

  "postMessages": [
    "Media plugin installed successfully!",
    "Please configure your storage provider in the config files.",
    "Don't forget to set up environment variables for your storage provider."
  ],

  "preMessages": [
    "Installing Media plugin...",
    "This will add media management capabilities to your application.",
    "You will need to configure storage settings after installation."
  ]
}
```

This example demonstrates:

1. **Basic Configuration**:
   - Plugin metadata (name, description, version)
   - Registration settings
   - Required packages and paths

2. **Variables**:
   - Different types (string, number)
   - Validation rules
   - Transformations
   - Conditional logic

3. **File Management**:
   - Template processing
   - Conditional file generation
   - Path placeholders

4. **Generator Features**:
   - Interactive arguments
   - File generation
   - Prisma schema modifications
   - Messages

5. **Prisma Integration**:
   - Model definitions
   - Relations
   - Enums
   - Conditional scripts

6. **Error Handling**:
   - Validation rules
   - Type checking
   - Path validation

This configuration creates a complete media management system with:
- File upload/download capabilities
- Multiple storage provider support
- Preview generation
- User association
- Type safety
- Automatic API generation

