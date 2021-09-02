FROM node:16.8.0-alpine3.13
LABEL org.opencontainers.image.title="generate-herrenberg-gtfs-flex"
LABEL org.opencontainers.image.description="Generate GTFS Flex for Herrenberg on-demand public transport service."
LABEL org.opencontainers.image.authors="Jannis R <mail@jannisr.de>"
LABEL org.opencontainers.image.documentation="https://github.com/derhuerst/generate-herrenberg-gtfs-flex"
LABEL org.opencontainers.image.source="https://github.com/derhuerst/generate-herrenberg-gtfs-flex"
LABEL org.opencontainers.image.licenses="ISC"

WORKDIR /app
ENV NODE_ENV=production
ENV npm_config_update-notifier=false

# for docker-entrypoint.sh
RUN apk add --no-cache bash moreutils

ADD package.json package-lock.json /app/
RUN npm install ci --only=production && npm cache clean --force

ADD . /app
RUN npm link

WORKDIR /gtfs
ENTRYPOINT ["/app/docker-entrypoint.sh"]
