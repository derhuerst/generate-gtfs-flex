FROM node:lts-alpine
LABEL org.opencontainers.image.title="generate-gtfs-flex"
LABEL org.opencontainers.image.description="Given a GTFS Static feed, add GTFS Flex v2 to model on-demand public transport service."
LABEL org.opencontainers.image.authors="Jannis R <mail@jannisr.de>"
LABEL org.opencontainers.image.documentation="https://github.com/derhuerst/generate-gtfs-flex"
LABEL org.opencontainers.image.source="https://github.com/derhuerst/generate-gtfs-flex"
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
