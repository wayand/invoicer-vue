# Build stage (use Node for building assets)
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build # Or whatever your build command is

# Production stage (use a lightweight web server)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html # Adjust '/app/dist' if your build output directory is different
EXPOSE 80

# Nginx serves static assets
CMD ["nginx", "-g", "daemon off;"]
