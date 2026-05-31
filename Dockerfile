# Stage 1: Build the frontend (admin)
FROM node:22-alpine AS frontend-builder

WORKDIR /app/admin
COPY admin/package*.json ./
RUN npm install

COPY admin/ ./
RUN npm run build

# Stage 2: Setup the backend and serve the built frontend
FROM node:22-alpine

WORKDIR /usr/src/app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ ./

# Copy the built frontend from Stage 1 into the backend's expected directory
COPY --from=frontend-builder /app/admin/dist ./frontend_dist

EXPOSE 5000

CMD ["npm", "start"]
