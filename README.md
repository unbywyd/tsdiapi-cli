# **TSDIAPI CLI**

A powerful and flexible **command-line interface (CLI)** for managing **TSDIAPI** projects.  
TSDIAPI is a modern, **ESM-based** framework built with **TypeScript** and **Fastify**, focusing on **high performance, modularity, and flexibility**. The CLI enables developers to **rapidly build APIs** with a well-structured, plugin-based architecture.

---

## **🚀 Overview**

**TSDIAPI CLI** is designed to simplify working with **TSDIAPI-based servers**. It provides:

✅ **Quick project setup** – Initialize new API projects with ease.  
✅ **ESM support** – Leverage modern JavaScript features with ESM modules.
✅ **Modular plugin system** – Extend functionality dynamically.  
✅ **Automatic code generation** – Generate controllers, services, and features effortlessly.  
✅ **Configuration management** – Easily handle environment variables and settings.  
✅ **Fastify-powered backend** – Lightweight, high-performance server with a flexible routing system.

By default, the generated project provides a **solid foundation** leveraging **Fastify**, **TypeBox**, and **TypeDI** for a **scalable and maintainable** API architecture.

---

## **📦 Get Started with npx**

```bash
npx @tsdiapi/cli create myapi
cd my-api
npm start
```

---

## **🔧 Installation**

To install **TSDIAPI CLI** globally using npm:

```bash
npm install -g @tsdiapi/cli
```

Once installed, use the `tsdiapi` command from any terminal.

---

## **🚀 Creating a New Project**

To create a new **Fastify-based API** project, use:

```bash
tsdiapi init <project-name>
```

This **guides you through an interactive setup**, allowing you to configure details like **project name, host, and port**.

### **⚡ Quick Start**

For a fast setup that **skips all prompts** and **immediately starts the server**, use:

```bash
tsdiapi start <project-name>
```

| Command  | Description                                                     |
| -------- | --------------------------------------------------------------- |
| `init`   | Creates a new project with interactive setup.                   |
| `create` | Alias for `init`, creates a new project with optional skipping. |
| `start`  | Creates a new project with defaults and starts it immediately.  |

---

## **🔌 Extending Your Project with Plugins**

TSDIAPI supports **modular plugins** to add features like **PrismaORM**, **WebSockets**, **JWT authentication**, etc.

### **Installing Plugins**

To install a new plugin, use:

```bash
tsdiapi plugins add <plugin-name>
```

For example, to add **Prisma support**:

```bash
tsdiapi plugins add prisma
```

### **Configuring Plugins**

Some plugins require additional setup. Use:

```bash
tsdiapi plugins config <plugin-name>
```

🔗 [Explore all available plugins](https://www.npmjs.com/search?q=%40tsdiapi)

---

## **⚙️ Generating Code Automatically**

TSDIAPI CLI features a **powerful code generation system** that detects installed plugins and their **generators** dynamically.

### **Using Generators**

To generate code, use:

```bash
tsdiapi generate <resource|pluginName> <name>
```

Example:

```bash
tsdiapi generate module user
```

This will create a **UserController**.

| Resource   | Description                        |
| ---------- | ---------------------------------- |
| `feature`  | Generate a new feature module.     |
| `service`  | Generate a new service.            |
| `module`   | Generate a new module.             |
| `<plugin>` | Use a specific plugin’s generator. |

## **TSDIAPI CLI Commands**

Below is a comprehensive list of all available commands in the TSDIAPI CLI, along with their descriptions.

| **Command**                         | **Description**                                                        |
| ----------------------------------- | ---------------------------------------------------------------------- |
| tsdiapi init [name]                 | Initializes a new TSDIAPI project with an interactive setup.           |
| tsdiapi create <name>               | Alias for init, creates a new project.                                 |
| tsdiapi start <name>                | Quickly creates a project with default settings and starts the server. |
| tsdiapi plugins add <pluginName>    | Adds a plugin to the project.                                          |
| tsdiapi add <pluginName>            | Alias for plugins add, adds a plugin to the project.                   |
| tsdiapi plugins config <pluginName> | Configures an installed plugin.                                        |
| tsdiapi config <pluginName>         | Alias for plugins config, configures a plugin.                         |
| tsdiapi plugins update <pluginName> | Updates an installed plugin.                                           |
| tsdiapi generate <pluginArg> <name> | Generates files using a plugin or built-in generator.                  |
| tsdiapi prisma                      | Adds PrismaORM to the project.                                         |
| tsdiapi feature <name>              | Alias for generate feature <name>, generates a new feature module.     |
| tsdiapi service <name> [feature]    | Alias for generate service <name> with optional feature module.        |
| tsdiapi controller <name> [feature] | Alias for generate controller <name> with optional feature module.     |

### Developer Commands

| **Command**               | **Description**                                 |
| ------------------------- | ----------------------------------------------- |
| tsdiapi dev plugin <name> | Creates a new plugin with an interactive setup. |
| tsdiapi dev check         | Validates the configuration of a plugin.        |

---

### **How Generators Work**

- **Plugins define generators**, introducing new capabilities.
- The CLI **automatically detects installed plugins** and their generators.
- No manual setup—just install plugins and start generating code.

---

## **🛠 Defining API Routes**

TSDIAPI provides a **structured route-building system** via `useRoute()`, using **Fastify & TypeBox**.

### **Example Controller**

```ts
import { AppContext } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";

export default function userController({ useRoute }: AppContext) {
  useRoute()
    .get("/users/:id")
    .params(Type.Object({ id: Type.String() }))
    .code(200, Type.Object({ id: Type.String(), name: Type.String() }))
    .handler(async (req) => {
      return { id: req.params.id, name: "John Doe" };
    })
    .build();
}
```

- **TypeBox schemas** ensure **runtime validation**.
- **useRoute() API** provides **chained route configuration**.

---

## **🔌 Plugin System & Lifecycle Hooks**

You can extend functionality with **custom plugins**. Each plugin can define:

| Lifecycle Hook | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `onInit`       | Runs **before server starts** – used for setup tasks.      |
| `beforeStart`  | Runs **before listening** – useful for last checks.        |
| `afterStart`   | Runs **after server starts** – ideal for background tasks. |

### **Example Plugin**

```ts
export function myPlugin() {
  return {
    name: "myPlugin",
    async onInit(context) {
      console.log("myPlugin: Initialized!");
    },
    async afterStart(context) {
      console.log("myPlugin: Server started!");
    },
  };
}
```

Register it in `createApp`:

```ts
import { createApp } from "@tsdiapi/server";
import { myPlugin } from "./api/plugins/myPlugin";

await createApp({
  plugins: [myPlugin()],
});
```

---

## **🔄 Configuration Management**

TSDIAPI **automatically loads `.env` variables** for easy configuration.

### **Example `.env` File**

```
PORT=3000
HOST=localhost
```

### **Accessing Config**

```ts
const port = context.projectConfig.get("PORT", 3000);
const host = context.projectConfig.get("HOST", "localhost");
```

---

## **📖 API Documentation & Swagger**

TSDIAPI **automatically generates OpenAPI documentation**.  
Once your server is running, check **Swagger UI**:

👉 `http://localhost:3000/docs`

---

## **Developing Plugins**

TSDIAPI CLI allows developers to create custom plugins that extend the framework. Plugins can introduce new services, middleware, configurations, and generators.

### **Creating a New Plugin**

To generate a new plugin, use:

```bash
tsdiapi dev plugin <name>
```

This will guide you through configuring the plugin, including:

- **Name** (automatically converted to the correct format).
- **Description**.
- **Author name**.
- **GitHub repository URL** (optional).
- **Automatic file loading** support.

Once configured, the CLI will generate the necessary files and set up a base plugin structure.

### **Validating Plugin Configuration**

To check if a plugin’s configuration is correct, use:

```bash
tsdiapi dev check
```

This command validates the plugin’s configuration and ensures it follows best practices.

---


## **🎯 Contributing & Contact**

TSDIAPI is an **open-source project**. Contributions are welcome! 🚀

📧 Contact: [unbywyd](https://unbywyd.com)

---

With **TSDIAPI**, you can build **fast, modular, and scalable** APIs with ease.  
Dive in and start building today! 🚀
