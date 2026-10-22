# Node + pnpm image for all package actions (install, build, test, storybook, publish)
ARG NODE_VERSION=26
FROM node:${NODE_VERSION}-slim

ARG PNPM_VERSION=12.14.0
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g pnpm@${PNPM_VERSION}

RUN mkdir -p /app && chown node:node /app

USER node
WORKDIR /app
ENV TURBO_TELEMETRY_DISABLED=1 \
    STORYBOOK_DISABLE_TELEMETRY=1
