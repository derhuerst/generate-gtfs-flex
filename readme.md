# generate-herrenberg-gtfs-flex

**Generate [GTFS Flex v2](https://github.com/MobilityData/gtfs-flex/blob/e1832cfea5ddb9df29bd2fc50e80b0a4987695c1/spec/reference.md) for Herrenberg on-demand public transport service.**

[![ISC-licensed](https://img.shields.io/github/license/derhuerst/generate-herrenberg-gtfs-flex.svg)](license.md)
[![Docker image build](https://img.shields.io/docker/cloud/build/derhuerst/generate-herrenberg-gtfs-flex)](https://hub.docker.com/r/derhuerst/generate-herrenberg-gtfs-flex)


## Installation

```shell
npm install derhuerst/generate-herrenberg-gtfs-flex
```


## Getting started

The scripts in this repo are written to be used with any GTFS feed. But there's also a file [`rufbusse.js`](rufbusse.js), which specifies the on-demand lines in [Herrenberg](https://en.wikipedia.org/wiki/Herrenberg) (part of [VVS](https://www.vvs.de)); and [`booking-rules.js`](booking-rules.js), which is also Herrenberg-specific because it uses `rufbusse.js`.

The following steps will demonstrate how to use the scripts with `rufbusse.js`, in order to patch the [VVS GTFS feed](https://www.openvvs.de/dataset/e66f03e4-79f2-41d0-90f1-166ca609e491) with GTFS-Flex data. They assume that you have installed [Node.js](https://nodejs.org/) (which includes [`npm`](https://docs.npmjs.com/cli/v7)).

```bash
# set up dev environment
mkdir flex
cd flex
npm init --yes

# download and unzip VVS GTFS feed
wget 'https://www.openvvs.de/dataset/e66f03e4-79f2-41d0-90f1-166ca609e491/resource/bfbb59c7-767c-4bca-bbb2-d8d32a3e0378/download/google_transit.zip' -O vvs.gtfs.zip
unzip -d vvs-gtfs vvs.gtfs.zip

# install generate-herrenberg-gtfs-flex
npm install derhuerst/generate-herrenberg-gtfs-flex -D

# patch GTFS-Flex data into the VVS GTFS feed
npm exec -- generate-locations-geojson \
	node_modules/generate-herrenberg-gtfs-flex/rufbusse.js \
	vvs-gtfs/{routes,trips,stops,stop_times}.txt \
	>vvs-gtfs/locations.geojson
npm exec -- generate-booking-rules-txt \
	node_modules/generate-herrenberg-gtfs-flex/booking-rules.js \
	>vvs-gtfs/booking_rules.txt
npm exec -- patch-stop-times-txt \
	node_modules/generate-herrenberg-gtfs-flex/rufbusse.js \
	vvs-gtfs/{routes,trips,stops,stop_times}.txt \
	| sponge vvs-gtfs/stop_times.txt
```

If you install the globally (via `npm install derhuerst/generate-herrenberg-gtfs-flex -g`), npm will put the scripts into your [`$PATH`](https://en.wikipedia.org/wiki/PATH_(variable)), so instead of using `npm exec`, you'll be able to just call them as documented below.


## Usage

```
Usage:
    generate-locations-geojson <path-to-rufbusse> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    generate-locations-geojson lib/rufbusse.js \
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/locations.geojson
```

```
Usage:
    generate-booking-rules-txt <path-to-booking-rules>
Examples:
	generate-booking-rules-txt booking-rules.js >gtfs/booking_rules.txt
```

```
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
