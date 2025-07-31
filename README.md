# Docker Worlds

A command-line tool for managing and deploying Docker-based virtual worlds and environments. This project provides a suite of utilities to initialize, launch, list, and push Docker worlds to registries.

## Overview

Docker Worlds is designed to let me create docker worlds for me and my pets. Mollydogs-park ftw!

## Features

- **Initialize Worlds**: Create new Docker world configurations with `world-init.js`
- **Launch Worlds**: Start and manage Docker world instances with `world-launch.js`
- **List Worlds**: View all available worlds and their status with `world-list.js`
- **Push Worlds**: Deploy worlds to Docker registries with `world-push.js`
- **Catalog Management**: Generate and maintain a catalog of available worlds with `generate-catalog.js`

## Scripts

### `world-init.js`
Initializes a new Docker world with the necessary configuration and structure.

```bash
node world-init.js [world-name]
```

### `world-launch.js`
Launches a Docker world instance from the available configurations.

```bash
node world-launch.js [world-name]
```

### `world-list.js`
Lists all available Docker worlds and their current status.

```bash
node world-list.js
```

### `world-push.js`
Pushes a Docker world to a specified registry for sharing or deployment.

```bash
node world-push.js [world-name] [registry]
```

### `generate-catalog.js`
Generates or updates the catalog.json file containing metadata about all available worlds.

```bash
node generate-catalog.js
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/joshcassell4/docker-worlds.git
cd docker-worlds
```

2. Install dependencies (if any):
```bash
npm install
```

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

Push a world to a registry:
```bash
node world-push.js my-world docker.io/username
```

## Project Structure

```
docker-worlds/
├── world-init.js       # World initialization script
├── world-launch.js     # World launching script
├── world-list.js       # World listing script
├── world-push.js       # World pushing script
├── generate-catalog.js # Catalog generation script
├── catalog.json        # World catalog metadata
└── README.md          # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/joshcassell4/docker-worlds).