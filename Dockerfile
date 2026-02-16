# ARG NODE_VERSION=24

FROM node:24-alpine AS base
WORKDIR /app

FROM base AS dev

RUN npm config set registry https://registry.npmmirror.com/

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 9926
CMD ["npm", "run", "dev"]

FROM base AS prod

RUN npm config set registry https://registry.npmmirror.com/

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 9923
CMD ["npm", "run", "prod"]