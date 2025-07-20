FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}


RUN npm run build
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html


RUN rm -rf ./*

COPY --from=build /app/dist .
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80