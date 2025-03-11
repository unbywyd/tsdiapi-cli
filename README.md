# **TSDIAPI CLI**

A powerful and flexible command-line interface (CLI) for managing **TSDIAPI** projects. TSDIAPI is a modern, **ESM-based** framework built with **TypeScript** and **NextNode**, focusing on **Dependency Injection (DI)** and seamless integration with **PrismaORM**. The CLI allows you to create, extend, and automate your API development workflow with built-in support for **plugins** and **generators**.

---

## **Overview**

**TSDIAPI CLI** is designed to provide a streamlined experience when working with **TSDIAPI-based servers**. It allows developers to:

- **Initialize** new API projects quickly.
- **Extend functionality** using modular plugins.
- **Automate code generation** for services, controllers, and features.
- **Manage configuration files** and environment variables effortlessly.
- **Integrate PrismaORM** for database management with ease.

By default, the generated project provides a **solid foundation** for further customization, leveraging the power of **Dependency Injection** and **PrismaORM** for a robust development experience.

---

## **Get Started with npx**

```bash
npx @tsdiapi/cli create my-api
cd my-api
npm start
```

## **Installation**

Install the CLI globally using npm:

```bash
npm install -g @tsdiapi/cli
```

Once installed, use the `tsdiapi` command from any terminal.

---

## **Creating a New Project**

To create a new API project, use:

```bash
tsdiapi init <project-name>
```

This will **guide you through an interactive setup**, allowing you to configure project details like name, host, and port.

### **Quick Start**

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

## **Extending Your Project with Plugins**

TSDIAPI supports modular extensions through **plugins**. Plugins can introduce features like **Prisma ORM**, **Socket.IO**, **JWT authentication**, and more.

### **Installing Plugins**

To install a new plugin, use:

```bash
tsdiapi plugins add <plugin-name>
```

For example, to add Prisma support:

```bash
tsdiapi plugins add prisma
```

### **Configuring Plugins**

Some plugins require additional configuration. Use:

```bash
tsdiapi plugins config <plugin-name>
```

This will guide you through setting up the necessary parameters.

🔗 [Explore all available plugins](https://www.npmjs.com/search?q=%40tsdiapi)

---

## **Generating Code Automatically**

TSDIAPI CLI features a **powerful code generation system** that detects installed plugins and their **generators** dynamically.

### **Using Generators**

To generate code, use:

```bash
tsdiapi generate <resource|pluginName> <name>
```

Example:

```bash
tsdiapi generate controller user
```

This will create a **UserController**.

| Resource     | Description                        |
| ------------ | ---------------------------------- |
| `feature`    | Generate a new feature module.     |
| `service`    | Generate a new service.            |
| `controller` | Generate a new controller.         |
| `<plugin>`   | Use a specific plugin’s generator. |

### **How Generators Work**

- **Plugins define generators.** Each plugin can introduce its own generators.
- The CLI **automatically detects installed plugins** and provides relevant options.
- You don’t need to configure generators manually—just install the required plugins.

---

## **PrismaORM Integration**

TSDIAPI seamlessly integrates with **PrismaORM** for database management. The framework uses **PrismaQL Core**, a powerful SQL-like DSL for safely and programmatically editing Prisma schema files. This ensures a flexible and robust development workflow.

To add Prisma to your project, use:

```bash
tsdiapi prisma
```

This command will install and configure Prisma in your project, allowing you to manage models, fields, relations, and more with ease.

🔗 [Learn more about PrismaQL Core](https://www.npmjs.com/package/prismaql)

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

## **Plugin Lifecycle Methods**

Each plugin supports the following lifecycle methods:

Here’s the updated table of all **TSDIAPI CLI commands** with their descriptions, formatted for a `README.md` file:

---

## **TSDIAPI CLI Commands**

Below is a comprehensive list of all available commands in the TSDIAPI CLI, along with their descriptions.

| **Command**                           | **Description**                                                        |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `tsdiapi init [name]`                 | Initializes a new TSDIAPI project with an interactive setup.           |
| `tsdiapi create <name>`               | Alias for `init`, creates a new project.                               |
| `tsdiapi start <name>`                | Quickly creates a project with default settings and starts the server. |
| `tsdiapi plugins add <pluginName>`    | Adds a plugin to the project.                                          |
| `tsdiapi add <pluginName>`            | Alias for `plugins add`, adds a plugin to the project.                 |
| `tsdiapi plugins config <pluginName>` | Configures an installed plugin.                                        |
| `tsdiapi config <pluginName>`         | Alias for `plugins config`, configures a plugin.                       |
| `tsdiapi plugins update <pluginName>` | Updates an installed plugin.                                           |
| `tsdiapi generate <pluginArg> <name>` | Generates files using a plugin or built-in generator.                  |
| `tsdiapi prisma`                      | Adds PrismaORM to the project.                                         |
| `tsdiapi feature <name>`              | Alias for `generate feature <name>`, generates a new feature module.   |
| `tsdiapi service <name> [feature]`    | Alias for `generate service <name>` with optional feature module.      |
| `tsdiapi controller <name> [feature]` | Alias for `generate controller <name>` with optional feature module.   |

### Developer Commands

| **Command**                 | **Description**                                 |
| --------------------------- | ----------------------------------------------- |
| `tsdiapi dev plugin <name>` | Creates a new plugin with an interactive setup. |
| `tsdiapi dev check`         | Validates the configuration of a plugin.        |

---

### **Usage Examples**

1. **Create a new project:**

   ```bash
   tsdiapi create my-api
   ```

2. **Add the plugin:**

   ```bash
   tsdiapi plugins add prisma
   ```

3. **Generate a feature:**

   ```bash
   tsdiapi generate feature user
   ```

   or

   ```bash
   tsdiapi feature user
   ```

4. **Add Prisma to the project:**
   ```bash
   tsdiapi prisma
   ```

---

### **Auto-loading Files**

If a plugin supports auto-loading files, it should specify `bootstrapFilesGlobPath` in its configuration. This ensures that all matching files are automatically registered.

---

## **Contributing & Contact**

TSDIAPI is an open-source project. Contributions are always welcome! If you want to contribute, suggest features, or report issues, feel free to reach out.

📧 Contact: [unbywyd](https://unbywyd.com)

🚀 Happy coding with **TSDIAPI CLI**!

---

## **Getting Started**

1. **Install the CLI:**

   ```bash
   npm install -g @tsdiapi/cli
   ```

2. **Create a new project:**

   ```bash
   tsdiapi init my-api
   ```

3. **Add Prisma support:**

   ```bash
   tsdiapi prisma
   ```

4. **Generate a new controller:**

   ```bash
   tsdiapi generate controller user
   ```

5. **Start your server:**

   ```bash
   cd my-api
   npm start
   ```

---

With **TSDIAPI**, you can build scalable, maintainable, and modular APIs with ease. Dive in and start building your next project today! 🚀
