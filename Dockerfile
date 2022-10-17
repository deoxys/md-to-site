# syntax=docker/dockerfile:1

FROM node:latest

ENV NODE_ENV=production

WORKDIR /app/md-to-site

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install 
COPY . .

WORKDIR /app
RUN npm install -g ./md-to-site

ENTRYPOINT [ "md-to-site" ]