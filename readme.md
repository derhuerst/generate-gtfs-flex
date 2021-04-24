# generate-herrenberg-gtfs-flex

**Generate GTFS Flex for Herrenberg on-demand public transport service.**

[![ISC-licensed](https://img.shields.io/github/license/derhuerst/generate-herrenberg-gtfs-flex.svg)](license.md)
[![Docker image build](https://img.shields.io/docker/cloud/build/derhuerst/generate-herrenberg-gtfs-flex)](https://hub.docker.com/r/derhuerst/generate-herrenberg-gtfs-flex)


## Installation

```shell
npm install derhuerst/generate-herrenberg-gtfs-flex
```


## Usage

```shell
Usage:
    generate-locations-geojson <path-to-rufbusse> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    generate-locations-geojson lib/rufbusse.js \
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/locations.geojson
```

```shell
Usage:
    gen-booking-rules-txt <path-to-booking-rules>
Examples:
	gen-booking-rules-txt lib/booking-rules.js >gtfs/booking_rules.txt
```

```shell
Usage:
    patch-stop-times-txt <path-to-rufbusse> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    patch-stop-times-txt lib/rufbusse.js \
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/stop_times.patched.txt
```

### with Docker

You can use the [`derhuerst/generate-herrenberg-gtfs-flex` Docker image](https://hub.docker.com/r/derhuerst/generate-herrenberg-gtfs-flex). It will call the tools documented above on a GTFS feed that you mount into the container:

```shell
docker run -v /path/to/gtfs:/gtfs --rm -it derhuerst/generate-herrenberg-gtfs-flex
```

**⚠️ This will overwrite the original `stop_times.txt` file.**


## Contributing

If you have a question or need support using `generate-herrenberg-gtfs-flex`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/generate-herrenberg-gtfs-flex/issues).
