# Deployment Instructions

This document outlines steps to deploy the FormAI Next.js application on a server using Docker and Docker Compose.

## Prerequisites

- Server with Docker and Docker Compose installed (Ubuntu 22.04 recommended)
- Git installed
- Port 3000 open (or adjust as needed)

## Steps

### 1. Clone the repository (if not already)

```bash
git clone https://github.com/bardoun7894/forma.git
cd forma/formai-next
```

### 2. Ensure environment variables are set

The `.env.local` file is already present with Firebase and OpenAI configurations. Verify the values are correct for your environment.

If you need to add Firebase Admin SDK service account, uncomment and set `FIREBASE_ADMIN_SERVICE_ACCOUNT` in `.env.local`.

### 3. Build and run with Docker Compose

```bash
docker-compose up -d --build
```

This will:
- Build the Docker image using the provided Dockerfile
- Start the container in detached mode
- Map host port 3000 to container port 3000
- Use the environment variables from `.env.local`

### 4. Check logs

```bash
docker-compose logs -f
```

### 5. Verify the application

Visit `http://<server-ip>:3000` in your browser.

### 6. Stopping the application

```bash
docker-compose down
```

## Updating

To update the application after code changes:

```bash
git pull origin main
docker-compose up -d --build
```

## Docker Commands Reference

- Build only: `docker build -t formai-next .`
- Run manually: `docker run -p 3000:3000 --env-file .env.local formai-next`
- View running containers: `docker ps`
- Enter container shell: `docker exec -it <container-id> sh`

## Server Configuration (Optional)

### Using systemd for auto-start

Create a systemd service file `/etc/systemd/system/formai-next.service`:

```
[Unit]
Description=FormAI Next.js App
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/forma/formai-next
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=root
Group=root

[Install]
WantedBy=multi-user.target
```

Then enable and start:

```bash
sudo systemctl enable formai-next
sudo systemctl start formai-next
```

## Troubleshooting

- If the build fails due to missing dependencies, ensure Node 20 is used (Dockerfile uses node:20-alpine).
- If Firebase connection fails, check that the API keys are correct and the Firebase project is set up.
- If the container exits immediately, check logs with `docker-compose logs`.
- Ensure the server has enough memory (at least 1GB) for the build process.

## Support

For further assistance, refer to the project documentation or contact the development team.