#!/bin/bash

# Navigate to the script's directory (root of the project)
cd "$(dirname "$0")"

echo "Stopping container edureel..."
docker stop edureel || true
docker rm edureel || true

echo "Deleting existing image edureel..."
docker rmi edureel || true

echo "Building new image edureel from the root directory..."
docker build -t edureel .

echo "Starting container edureel detached with envs from backend/.env and mounting uploads directory..."
docker run -d --name edureel --env-file backend/.env -v "$PWD/uploads:/usr/src/app/uploads" -p 5000:5000 edureel

echo "Deployment complete."
