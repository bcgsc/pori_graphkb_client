# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:16 as build-stage

ARG API_BASE_URL
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM

WORKDIR /app
COPY package*.json /app/
RUN npm ci
COPY ./ /app/
RUN npm run build:docker

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1.15-alpine

COPY --from=build-stage /app/dist/production /usr/share/nginx/html
# Default port exposure
EXPOSE 80

# Copy .env file and shell script to container
WORKDIR /usr/share/nginx/html
COPY ./config/.env .
COPY ./config/env.sh .
# Add bash
RUN apk add --no-cache bash

# Make our shell script executable
RUN chmod +x env.sh

# Copy the nginx.conf
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["/bin/bash", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]
