# Docker Worlds

A command-line tool for creating, managing, and deploying self-contained Docker environments called "worlds". This project provides a comprehensive suite of utilities to initialize, launch, list, stop, and push Docker worlds to registries. Each world is a containerized application that can be either web-based or CLI-based.

## Overview

Docker Worlds simplifies the process of creating and managing containerized applications with minimal configuration. Whether you're building web applications, CLI tools, or development environments, Docker Worlds provides a consistent interface for container lifecycle management. The project includes both web and CLI world types, with support for volume mounting for development workflows.

## Features

- **Initialize Worlds**: Create new Docker world configurations with customizable templates for web and CLI applications
- **Launch Worlds**: Start Docker containers with automatic image building, port mapping, and browser launching for web worlds
- **Stop Worlds**: Gracefully stop running world containers based on their image
- **List Worlds**: View all available worlds in your project directory
- **Push Worlds**: Deploy worlds to Docker registries (GitHub Container Registry by default)
- **Catalog Management**: Generate and maintain a catalog of available worlds with metadata
- **Volume Mounting**: Support for development workflows with live code reloading
- **Multiple World Types**: Support for both web (nginx-based) and CLI (node-based) applications

## Scripts

### `world-init.js`
Initializes a new Docker world with the necessary configuration and structure.

```bash
node world-init.js <world-name> [options]
```

**Options:**
- `--type=web|cli` - World type (default: web)
- `--desc="..."` - World description
- `--port=8080` - Port number for web worlds (default: 8080)
- `--entry="npm start"` - Entry command (default: npm start)
- `--tags=tag1,tag2` - Comma-separated tags

### `world-launch.js`
Launches a Docker world instance with automatic image building if needed.

```bash
node world-launch.js [world-directory] [options]
```

**Options:**
- `--port=<number>` - Override the default port
- `--detach` or `-d` - Run container in detached mode (web worlds only)

**Features:**
- Automatically builds Docker image if not found locally
- Opens browser for web worlds
- Supports volume mounting for development (if configured in world.json)

### `world-list.js`
Lists all available Docker worlds in the current directory.

```bash
node world-list.js
```

### `world-stop.js`
Stops a running Docker world container.

```bash
node world-stop.js [world-directory]
```

**Features:**
- Finds and stops containers based on the world's image name
- Handles multiple containers if several instances are running

### `world-push.js`
Pushes a Docker world to GitHub Container Registry.

```bash
node world-push.js [world-directory]
```

**Features:**
- Builds the Docker image locally
- Tags the image with the GitHub Container Registry URL
- Pushes to `ghcr.io/[username]/[world-name]`

### `generate-catalog.js`
Generates or updates the catalog.json file containing metadata about all available worlds.

```bash
node generate-catalog.js
```

## Prerequisites

- Node.js (v14 or higher)
- Docker Desktop or Docker Engine installed and running
- Git (for pushing to GitHub Container Registry)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/joshcassell4/docker-worlds.git
cd docker-worlds
```

2. No npm dependencies required - all scripts use Node.js built-in modules

## Usage

### Creating a New World

1. Initialize a new world:
```bash
node world-init.js my-world
```

2. Configure your world by editing the generated configuration files

3. Launch your world:
```bash
node world-launch.js my-world
```

### Managing Existing Worlds

View all available worlds:
```bash
node world-list.js
```

Stop a running world:
```bash
node world-stop.js my-world
```

Push a world to GitHub Container Registry:
```bash
node world-push.js my-world
```

Generate or update the catalog:
```bash
node generate-catalog.js
```

## Project Structure

```
docker-worlds/
├── world-init.js       # World initialization script
├── world-launch.js     # World launching script
├── world-list.js       # World listing script
├── world-stop.js       # World stopping script
├── world-push.js       # World pushing script
├── generate-catalog.js # Catalog generation script
├── catalog.json        # World catalog metadata
├── README.md          # This file
└── [world-directories] # Individual world directories
    ├── Dockerfile      # Container definition
    ├── world.json      # World configuration
    └── app/           # Application files
```

### World Configuration (world.json)

Each world directory contains a `world.json` file with the following structure:

```json
{
  "name": "world-name",
  "image": "ghcr.io/namespace/world-name",
  "description": "World description",
  "entry": "npm start",
  "type": "web|cli",
  "port": 8080,
  "tags": ["tag1", "tag2"],
  "volumeMount": true  // Optional: for development
}
```

## Example Worlds

The project includes several example worlds:

- **mollydogs-park**: A web-based world showcasing dogs in a park
- **my-park**: A Flask-based web application with volume mounting for development
- **my-cli-park**: A CLI world example

## Development Features

### Volume Mounting
For web development workflows, you can enable volume mounting in your world.json:

```json
{
  "volumeMount": true
}
```

This allows you to edit files locally and see changes immediately in the running container.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/joshcassell4/docker-worlds).