Вот детальное руководство по созданию **TSDIAPI plugins**, включая **структуру, конфигурацию, генераторы и примеры кода**.

---

# **📌 TSDIAPI Plugin Development Guide**
This guide provides **detailed instructions** for writing **TSDIAPI plugins**, including **configuration, file structure, automatic modifications, and generators**.

---

## **1️⃣ Plugin Basics**
A **TSDIAPI plugin** extends server functionality by adding controllers, services, middleware, or integrations.

Each plugin follows a **modular architecture**:
- **Entry point (`index.ts`)** → Registers the plugin in TSDIAPI.
- **Configuration (`tsdiapi.config.json`)** → Defines installation settings, environment variables, and file modifications.
- **Provider (`provider.ts`)** → Implements business logic.
- **Files & Generators (`files/`, `generators/`)** → Handles additional structures for extending the API.

---

## **2️⃣ Plugin File Structure**
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

### **🟢 `index.ts` (Plugin Entry)**
Registers the plugin with TSDIAPI.

```ts
import "reflect-metadata";
import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { MyPluginProvider } from "./provider";

let pluginProvider: MyPluginProvider | null = null;

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
        if (pluginProvider) {
            ctx.logger.warn("⚠ Plugin is already initialized.");
            return;
        }

        this.context = ctx;
        const appConfig = ctx.config.appConfig || {};
        this.config.apiKey = this.config.apiKey || appConfig["MYPLUGIN_API_KEY"];

        if (!this.config.apiKey) {
            throw new Error("❌ Missing API key.");
        }

        this.provider.init(this.config, ctx.logger);
        pluginProvider = this.provider;

        ctx.logger.info("✅ Plugin initialized.");
    }
}

export function getMyPluginProvider(): MyPluginProvider {
    if (!pluginProvider) {
        throw new Error("❌ Plugin not initialized.");
    }
    return pluginProvider;
}

export { MyPluginProvider };
export default function createPlugin(config?: PluginOptions) {
    return new MyPlugin(config);
}
```

---

### **🟢 `provider.ts` (Main Logic)**
Defines **business logic** for the plugin.

```ts
import type { Logger } from "winston";

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

---

### **🟢 `tsdiapi.config.json` (Plugin Configuration)**
Defines:
- **Variables (`variables`)** → Configure plugin behavior via environment variables.
- **File modifications (`postFileModifications`)** → Modify Prisma schema or other files dynamically.
- **Generators (`generators`)** → Automate creating controllers, services, etc.

```json
{
  "name": "@tsdiapi/myplugin",
  "description": "A TSDIAPI plugin to fetch external data.",
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
  "postFileModifications": [
    {
      "path": "prisma/schema.prisma",
      "mode": "append",
      "match": "generator client",
      "expected": false,
      "content": "model MyPluginData {\n  id String @id @default(cuid())\n  query String\n  response String\n}"
    }
  ],
  "generators": [
    {
      "name": "feature",
      "description": "Generate a feature for MyPlugin.",
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
  ],
  "postMessages": [
    "✅ MyPlugin setup complete!",
    "🔹 Use `getMyPluginProvider()` to access the plugin."
  ]
}
```

---

## **3️⃣ Modifications & Dynamic File Handling**
**TSDIAPI** plugins can modify existing files. Example:

**Adding a new model to `prisma/schema.prisma`**
```json
{
  "path": "prisma/schema.prisma",
  "mode": "append",
  "match": "generator client",
  "expected": false,
  "content": "model MyPluginModel {\n  id String @id @default(cuid())\n  name String @unique\n}"
}
```

---

## **4️⃣ Generators (Automating Plugin Structure)**
A **generator** automates file creation. Example:

```json
{
  "name": "feature",
  "description": "Generate a feature for MyPlugin.",
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
```

### **📌 Example Handlebars Template**
`generators/feature/feature.controller.ts`
```ts
import { JsonController, Get } from "routing-controllers";

@JsonController("/{{featureName}}")
export class {{pascalCase featureName}}Controller {
    @Get("/")
    public getAll() {
        return { message: "Hello from {{featureName}}!" };
    }
}
```

---

## **5️⃣ Example Plugin Installation & Usage**
### **Installing the Plugin**
```bash
tsdiapi plugins add myplugin
```

### **Generating a Feature**
```bash
tsdiapi generate myplugin feature
```

### **Using the Plugin in a TSDIAPI Server**
```ts
import { createApp } from "@tsdiapi/server";
import MyPlugin from "@tsdiapi/myplugin";

createApp({
  plugins: [MyPlugin({ apiKey: "your-api-key" })],
});
```

---

## **6️⃣ Summary**
✔ **TSDIAPI plugins are modular and extend API functionality.**  
✔ **`index.ts` registers the plugin, `provider.ts` contains logic.**  
✔ **`tsdiapi.config.json` defines variables, file modifications, and generators.**  
✔ **Generators automate feature creation (controllers, services, etc.).**  
✔ **Plugins can modify existing files dynamically.**

🚀 **Now you're ready to create a TSDIAPI plugin!**

### **TSDIAPI Plugin Development Protocol**

### Requirements
1. **Plugin Naming Conventions**
   - Plugin names must be lowercase with hyphens (`tsdiapi-plugin-name`).

2. **Project Structure**
   - Every plugin must have:
     - `src/index.ts` (entry point)
     - `tsdiapi.config.json` (configuration)
     - `README.md` (documentation)
     - Optional `files/` and `generators/` folders

3. **Configuration (`tsdiapi.config.json`)**
   - Define plugin metadata: `name`, `description`, `variables`, `files`, `generators`
   - Use `variables` for configurable ENV parameters
   - `files` define static and Handlebars-processed template files
   - `generators` must support arguments and post-install steps

4. **Plugin Initialization (`index.ts`)**
   - Implement `AppPlugin`
   - Provide `onInit(ctx: AppContext)` for setup
   - Use `globControllersPath` if auto-registering controllers
   - Handle optional dependencies inside `onInit`

5. **Dependency Management**
   - Declare required packages in `requiredPackages`
   - Ensure Prisma-dependent plugins verify `prisma/schema.prisma`
   - Use `peerDependencies` to avoid unnecessary package installations

6. **File Modifications**
   - Use `postFileModifications` for schema changes (`append`, `prepend`)
   - Validate expected content before modifying
   - Avoid overwriting critical files

7. **Generators**
   - Must define `args` with `name`, `type`, and validation
   - Support `fileModifications` for Prisma models and other configs
   - Ensure `afterGenerate` triggers relevant commands (e.g., `npx prisma generate`)

8. **Logging & Debugging**
   - Use `ctx.logger.info()` for standard logging
   - Log warnings if required ENV variables are missing
   - Prevent crashes by handling exceptions in `onInit`

9. **Error Handling**
   - Fail fast if critical configuration is missing
   - Provide fallback defaults where possible
   - Always catch and log errors in async functions

10. **Plugin API Exposure**
   - Provide a `getProvider()` function if exposing an API
   - Ensure `provider.init()` is called in `onInit`
   - Validate configurations before execution

11. **Testing & Validation**
   - Ensure generated files match expected output
   - Use CLI commands (`tsdiapi dev check`) to verify structure
   - Test with at least one real-world integration

12. **Publishing Guidelines**
   - Version format: `0.x.x` for unstable, `1.x.x` for stable
   - Use `MIT` license unless explicitly required otherwise
   - Include `publishConfig: { "access": "public" }` for public NPM access

This protocol ensures consistency and maintainability across all TSDIAPI plugins.