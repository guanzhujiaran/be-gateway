# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine as base
WORKDIR /app

FROM base as dev
RUN export PUPPETEER_SKIP_DOWNLOAD=true

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    export PUPPETEER_SKIP_DOWNLOAD=true && npm ci --include=dev
EXPOSE 9926
CMD npm run dev

FROM base as prod

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
        export PUPPETEER_SKIP_DOWNLOAD=true && npm ci --include=dev

COPY . .
EXPOSE 9923
CMD npm run prod