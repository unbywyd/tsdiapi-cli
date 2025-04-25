# Plugin Development Guide

This guide provides detailed instructions for developing TSDIAPI plugins, including configuration, file structure, and best practices.

## 🚀 Getting Started

### Creating a New Plugin
To create a new empty plugin, use the following command:

```bash
tsdiapi dev plugin <name>
```

This will:
- Create a new plugin directory with the specified name
- Set up the basic file structure
- Initialize the necessary configuration files
- Create a basic plugin implementation

Example:
```bash
tsdiapi dev plugin my-plugin
```

The command will create a plugin with the following structure:
```
📂 tsdiapi-my-plugin/
 ├── 📜 package.json
 ├── 📜 tsdiapi.config.json
 ├── 📜 README.md
 ├── 📂 src/
 │   ├── 📜 index.ts
 │   ├── 📜 provider.ts
```

## 📦 Plugin Basics

A TSDIAPI plugin extends server functionality by adding controllers, services, middleware, or integrations.

Each plugin follows a modular architecture:
- **Entry point (`index.ts`)** → Registers the plugin in TSDIAPI
- **Configuration (`tsdiapi.config.json`)** → Defines installation settings
- **Provider (`provider.ts`)** → Implements business logic
- **Files & Generators (`files/`, `generators/`)** → Handles additional structures

## 📁 Plugin File Structure

A typical TSDIAPI plugin follows this structure:

```
📂 tsdiapi-myplugin/
 ├── 📜 package.json
 ├── 📜 tsdiapi.config.json
 ├── 📜 README.md
 ├── 📂 src/
 │   ├── 📜 index.ts
 │   ├── 📜 provider.ts
 │   ├── 📂 features/
 │   │   ├── 📜 myfeature.controller.ts
 │   │   ├── 📜 myfeature.service.ts
 │   │   ├── 📜 myfeature.dto.ts
 ├── 📂 files/
 ├── 📂 generators/
```

## 🔧 Plugin Components

### 1. Entry Point (`index.ts`)
```typescript
import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { MyPluginProvider } from "./provider";

export type PluginOptions = {
    apiKey?: string;
};

const defaultConfig: PluginOptions = {
    apiKey: "",
};

class MyPlugin implements AppPlugin {
    name = "tsdiapi-myplugin";
    config: PluginOptions;
    context: AppContext;
    provider: MyPluginProvider;

    constructor(config?: PluginOptions) {
        this.config = { ...defaultConfig, ...config };
        this.provider = new MyPluginProvider();
    }

    async onInit(ctx: AppContext) {
        this.context = ctx;
        const appConfig = ctx.config.appConfig || {};
        this.config.apiKey = this.config.apiKey || appConfig["MYPLUGIN_API_KEY"];

        if (!this.config.apiKey) {
            throw new Error("Missing API key");
        }

        this.provider.init(this.config, ctx.fastify.log);
    }
}

export default function createPlugin(config?: PluginOptions) {
    return new MyPlugin(config);
}
```

### 2. Provider (`provider.ts`)
```typescript
import type { AppContext } from "@tsdiapi/server";
type Logger = AppContext["fastify"]["log"];

export class MyPluginProvider {
    private config: { apiKey: string };
    private logger: Logger;

    init(config: { apiKey: string }, logger: Logger) {
        this.config = config;
        this.logger = logger;
    }

    async fetchData(query: string): Promise<string> {
        this.logger.info(`Fetching data with query: ${query}`);
        return `Response for: ${query}`;
    }
}
```

### 3. Configuration (`tsdiapi.config.json`)
```json
{
  "name": "@tsdiapi/myplugin",
  "description": "A TSDIAPI plugin to fetch external data",
  "variables": [
    {
      "name": "MYPLUGIN_API_KEY",
      "type": "string",
      "default": "",
      "configurable": true,
      "description": "API Key for authentication",
      "inquirer": {
        "type": "input",
        "message": "Enter your API key:"
      }
    }
  ],
  "generators": [
    {
      "name": "feature",
      "description": "Generate a feature for MyPlugin",
      "args": [
        {
          "name": "featureName",
          "description": "Feature name",
          "inquirer": {
            "type": "input",
            "message": "Enter the feature name:"
          }
        }
      ],
      "files": [
        {
          "source": "generators/feature/*.ts",
          "destination": "src/features/{{featureName}}/",
          "isHandlebarsTemplate": true
        }
      ]
    }
  ]
}
```

### 4. Prisma Integration

TSDIAPI plugins can extend Prisma in two ways:

1. **Root Level Prisma Extension** (`tsdiapi.config.json` root)
   - Executed during plugin installation
   - Used for core models and enums
   - Example:
   ```json
   {
     "prisma": {
       "required": true,
       "scripts": [
         {
           "command": "ADD ENUM MediaType ({IMAGE|VIDEO|DOCUMENT|OTHER});",
           "description": "Add MediaType enum",
           "when": "MEDIA_ENABLED === 'true'"
         }
       ]
     }
   }
   ```
   - `when` condition uses plugin variables directly
   - Example variables:
   ```json
   {
     "variables": [
       {
         "name": "MEDIA_ENABLED",
         "type": "string",
         "default": "false",
         "configurable": true,
         "description": "Enable media functionality",
         "inquirer": {
           "type": "input",
           "message": "Enable media functionality? (true/false):"
         }
       },
       {
         "name": "MEDIA_PREVIEW_SIZE",
         "type": "number",
         "default": 512,
         "configurable": true,
         "description": "The size of the media preview image in pixels",
         "inquirer": {
           "type": "input",
           "message": "Enter the width of the media preview image in pixels:"
         }
       }
     ]
   }
   ```

2. **Generator Level Prisma Extension** (inside generators)
   - Executed during feature generation
   - Used for feature-specific models
   - Example:
   ```json
   {
     "generators": [
       {
         "name": "feature",
         "args": [
           {
             "name": "userModelName",
             "description": "Prisma model name for users",
             "inquirer": {
               "type": "input",
               "message": "Enter the Prisma model name for users:",
               "default": "User"
             }
           },
           {
             "name": "withMedia",
             "type": "boolean",
             "default": false,
             "description": "Include media functionality",
             "inquirer": {
               "type": "confirm",
               "message": "Include media functionality?"
             }
           }
         ],
         "prismaScripts": [
           {
             "command": "ADD MODEL Media ({id String @id @default(cuid())});",
             "description": "Add Media model",
             "when": "withMedia === true"
           }
         ]
       }
     ]
   }
   ```
   - `when` condition uses generator arguments directly

Prisma scripts support:
- Adding models
- Adding enums
- Adding relations
- Modifying existing models
- Conditional execution using `when` expressions

The `when` condition:
- Uses JEXL expressions
- Evaluates to boolean
- In root scripts: uses plugin variables directly
- In generator scripts: uses generator arguments directly
- If not specified, script always executes

### 5. Advanced Configuration Examples

#### Variable Configuration
```json
{
  "variables": [
    {
      "name": "MYPLUGIN_SECRET",
      "type": "string",
      "default": "",
      "configurable": true,
      "description": "Secret key for the plugin",
      "inquirer": {
        "type": "input",
        "message": "Enter your secret key:"
      },
      "validate": {
        "type": "string",
        "minLength": 10,
        "errorMessage": "Secret key must be at least 10 characters long."
      }
    },
    {
      "name": "MYPLUGIN_TIMEOUT",
      "type": "number",
      "default": 60,
      "configurable": true,
      "description": "Timeout in seconds",
      "inquirer": {
        "type": "number",
        "message": "Enter timeout in seconds:"
      },
      "validate": {
        "type": "integer",
        "minimum": 1,
        "errorMessage": "Timeout must be a positive number."
      },
      "transform": "x * 1000"
    }
  ]
}
```

#### Generator with Prisma Relations
```json
{
  "generators": [
    {
      "name": "feature_with_relations",
      "description": "Generate a feature with Prisma relations",
      "dependencies": [
        "@tsdiapi/prisma"
      ],
      "files": [
        {
          "source": "generators/feature_with_relations/*.*",
          "destination": "{{name}}",
          "overwrite": false,
          "isHandlebarsTemplate": true
        }
      ],
      "args": [
        {
          "name": "parentModelName",
          "description": "Parent model name",
          "inquirer": {
            "type": "input",
            "message": "Enter the parent model name:",
            "default": "Parent"
          }
        },
        {
          "name": "childModelName",
          "description": "Child model name",
          "inquirer": {
            "type": "input",
            "message": "Enter the child model name:",
            "default": "Child"
          }
        }
      ],
      "prismaScripts": [
        {
          "command": "ADD MODEL {{pascalCase parentModelName}} ({id String @id @default(cuid()) | name String });",
          "description": "Add parent model to Prisma schema"
        },
        {
          "command": "ADD MODEL {{pascalCase childModelName}} ({id String @id @default(cuid()) | name String | parentId String });",
          "description": "Add child model to Prisma schema"
        },
        {
          "command": "ADD RELATION {{pascalCase parentModelName}} AND {{pascalCase childModelName}} (fkHolder={{pascalCase childModelName}}, type=1:M);",
          "description": "Add relation between models"
        }
      ]
    }
  ]
}
```

## 📝 Best Practices

1. **Naming Conventions**
   - Use lowercase with hyphens for plugin names
   - Follow TSDIAPI naming patterns

2. **Project Structure**
   - Maintain consistent file organization
   - Include all required files
   - Document your plugin

3. **Configuration**
   - Use environment variables for sensitive data
   - Provide sensible defaults
   - Document all configuration options

4. **Error Handling**
   - Implement proper error handling
   - Provide meaningful error messages
   - Log errors appropriately

5. **Testing**
   - Write unit tests for your plugin
   - Test with different configurations
   - Verify integration with TSDIAPI

6. **Prisma Integration**
   - Define clear model relationships
   - Use appropriate field types
   - Add necessary indexes
   - Document model relationships
   - Handle migrations carefully

7. **Configuration Validation**
   - Use strong validation rules
   - Provide clear error messages
   - Transform values when needed
   - Set appropriate defaults
   - Document all configuration options

## 🔗 Additional Resources

- [Plugin Overview](../plugins/overview.md)
- [Plugin Installation Guide](../plugins/installation.md)
- [Official Plugin Documentation](https://tsdiapi.dev/plugins)
