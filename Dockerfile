# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:22 as build-stage

ARG API_BASE_URL
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM
ARG PUBLIC_PATH

WORKDIR /app
COPY package*.json /app/
RUN npm ci
COPY ./ /app/
RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1.15-alpine

COPY --from=build-stage /app/dist/production /usr/share/nginx/html
# Default port exposure
EXPOSE 80

# Copy .env file and shell script to container
WORKDIR /usr/share/nginx/html
# Add bash
RUN apk add --no-cache bash

# Copy the nginx.conf
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["/bin/bash", "-c", "nginx -g \"daemon off;\""]
