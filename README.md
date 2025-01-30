# **TSDIAPI CLI**

A powerful and flexible command-line interface (CLI) for managing TSDIAPI projects. Easily initialize projects with built-in support for plugins like Prisma, Socket.IO, Email services, and more.

---

## **Features**

- Generate new TSDIAPI projects in seconds.
- Add support for popular plugins like Prisma and Socket.IO.
- Manage configuration files, environment variables, and project structure.
- Flexible plugin architecture to customize your API services.

---

## **Installation**

Install globally via npm:

```bash
npm install -g @tsdiapi/cli
```

Alternatively, add it to your project:

```bash
npm install --save-dev @tsdiapi/cli
```

---

## **Usage**

### **Create a New Project**

```bash
tsdiapi init
```

This command walks you through project setup, including options to install plugins like Prisma or Socket.IO.

---

### **Available Commands**

```bash
tsdiapi <command> [options]
```

| Command      | Description                         |
| ------------ | ----------------------------------- |
| `init`       | Initialize a new TSDIAPI project    |
| `plugin:add` | Add a plugin to an existing project |
| `build`      | Build the project                   |
| `dev`        | Run the project in development mode |

---

## **Plugin Support**

Easily extend your project with plugins:

- `@tsdiapi/cli` supports plugins for Prisma, Socket.IO, JWT authentication, Email, and more.

Example of registering a plugin in `@tsdiapi/server`:

```typescript
import createPlugin from "@tsdiapi/plugin-name";
import { createApp } from "@tsdiapi/server";

createApp({
  plugins: [
    createPlugin({
      /* Plugin configuration */
    }),
  ],
});
```

---

## **Configuration**

By default, the CLI generates a `.env` file and other necessary configurations. You can modify these files to fit your needs.

---

## **Contributing**

Feel free to contribute! Submit issues and pull requests at [GitHub](https://github.com/unbywyd/tsdiapi-cli).

---

## **License**

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
