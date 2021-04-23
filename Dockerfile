FROM node:alpine
LABEL org.opencontainers.image.title="generate-herrenberg-gtfs-flex"
LABEL org.opencontainers.image.description="Generate GTFS Flex for Herrenberg on-demand public transport service."
LABEL org.opencontainers.image.authors="Jannis R <mail@jannisr.de>"
LABEL org.opencontainers.image.documentation="https://github.com/derhuerst/generate-herrenberg-gtfs-flex"
LABEL org.opencontainers.image.source="https://github.com/derhuerst/generate-herrenberg-gtfs-flex"
LABEL org.opencontainers.image.licenses="ISC"

WORKDIR /app

# for docker-entrypoint.sh
RUN apk add --no-cache bash

ADD package.json /app/
RUN npm install --production && npm cache clean --force

ADD . /app
RUN npm link

WORKDIR /gtfs
CMD ["/app/docker-entrypoint.sh"]
