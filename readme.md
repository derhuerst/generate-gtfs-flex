# generate-herrenberg-gtfs-flex

**Generate [GTFS Flex v2](https://github.com/MobilityData/gtfs-flex/blob/e1832cfea5ddb9df29bd2fc50e80b0a4987695c1/spec/reference.md) for Herrenberg on-demand public transport service.**

[![ISC-licensed](https://img.shields.io/github/license/derhuerst/generate-herrenberg-gtfs-flex.svg)](license.md)
[![Docker image build](https://img.shields.io/docker/cloud/build/derhuerst/generate-herrenberg-gtfs-flex)](https://hub.docker.com/r/derhuerst/generate-herrenberg-gtfs-flex)


## Installation

```shell
npm install derhuerst/generate-herrenberg-gtfs-flex
```


## Getting started

The scripts in this repo are written to be used with any GTFS feed. But there's also a file [`herrenberg-flex-rules.js`](herrenberg-flex-rules.js), which specifies the on-demand lines in [Herrenberg, Germany](https://en.wikipedia.org/wiki/Herrenberg) (part of [VVS](https://www.vvs.de)).

The following steps will demonstrate how to use the scripts with `herrenberg-flex-rules.js`, in order to patch the [VVS GTFS feed](https://www.openvvs.de/dataset/e66f03e4-79f2-41d0-90f1-166ca609e491) with GTFS-Flex data. They assume that you have installed [Node.js](https://nodejs.org/) (which includes [`npm`](https://docs.npmjs.com/cli/v7)).

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
	node_modules/generate-herrenberg-gtfs-flex/herrenberg-flex-rules.js \
	vvs-gtfs/{routes,trips,stops,stop_times}.txt \
	>vvs-gtfs/locations.geojson
npm exec -- generate-booking-rules-txt \
	node_modules/generate-herrenberg-gtfs-flex/herrenberg-flex-rules.js \
	vvs-gtfs/routes.txt \
	>vvs-gtfs/booking_rules.txt
npm exec -- patch-stop-times-txt \
	node_modules/generate-herrenberg-gtfs-flex/herrenberg-flex-rules.js \
	vvs-gtfs/{routes,trips,stops,stop_times}.txt \
	| sponge vvs-gtfs/stop_times.txt
```

If you install the globally (via `npm install derhuerst/generate-herrenberg-gtfs-flex -g`), npm will put the scripts into your [`$PATH`](https://en.wikipedia.org/wiki/PATH_(variable)), so instead of using `npm exec`, you'll be able to just call them as documented below.


## Usage

```
Usage:
    generate-locations-geojson <path-to-flex-rules> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    generate-locations-geojson flex-rules.js \
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/locations.geojson
```

```
Usage:
    generate-booking-rules-txt <path-to-flex-rules> <gtfs-routes>
Examples:
    generate-booking-rules-txt flex-rules.js gtfs/routes.txt >gtfs/booking_rules.txt
```

```
Usage:
    patch-stop-times-txt <path-to-flex-rules> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    patch-stop-times-txt flex-rules.js \
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/stop_times.patched.txt
```

### with Docker

You can use the [`derhuerst/generate-herrenberg-gtfs-flex` Docker image](https://hub.docker.com/r/derhuerst/generate-herrenberg-gtfs-flex). It will call the tools documented above on a GTFS feed that you mount into the container:

```shell
docker run -v /path/to/gtfs:/gtfs --rm -it derhuerst/generate-herrenberg-gtfs-flex
```

**⚠️ This will overwrite the original `stop_times.txt` file.**


### with your own GTFS feed & GTFS-Flex rules

You can use the scripts in this repo with *any* GTFS feed. As an example, we're going to patch [`sample-gtfs-feed`](https://github.com/public-transport/sample-gtfs-feed)'s `A` ("Ada Lovelace Bus Line") route to have flexible on-demand drop-offs.

```shell
mkdir sample-gtfs-feed-with-flex
cd sample-gtfs-feed-with-flex
npm init --yes
npm install --save-dev sample-gtfs-feed derhuerst/generate-herrenberg-gtfs-flex
```

We're going to write a file `flex-rules.js` that exports a list of GTFS-Flex *rules*. Each of these rules is a functions that should, when given a `routes.txt` entry/row, return either `null` to leave it unchanged or return a GTFS-Flex *spec* (check out [the schema](lib/flex-spec-schema.json)) to patch it:

```js
const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const bookingTypes = require('gtfs-utils/booking-types')

const adaLovelaceFlexibleDropOff = (route) => {
	if (route.id !== 'A') return null // leave route unchanged
	return {
		id: 'A-flexible-drop-off', // ID of the GTFS-Flex spec
		radius: .200, // flexible drop-off within 200m of a stop
		pickup_type: pickupTypes.MUST_PHONE_AGENCY,
		drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
		bookingRule: {
			// ID of the GTFS-BookingRules booking_rules.txt entry/row
			booking_rule_id: 'flexible-drop-off',
			booking_type: bookingTypes.SAME_DAY,
			prior_notice_duration_min: 30,
			message: 'Get dropped off right at home! Please call 30min before.',
			booking_url: 'https://example.org/flex'
		},
	}
}

module.exports [
	adaLovelaceFlexibleDropOff,
]
```

We can now patch GTFS-Flex data into `sample-gtfs-feed`'s GTFS data:

```shell
# copy the GTFS feed first, so that we don't mutate node_modules
cp -r node_modules/sample-gtfs-feed/gtfs gtfs

npm exec -- generate-locations-geojson \
	flex-rules.js gtfs/{routes,trips,stops,stop_times}.txt \
	>gtfs/locations.geojson
npm exec -- generate-booking-rules-txt \
	flex-rules.js gtfs/routes.txt \
	>gtfs/booking_rules.txt
npm exec -- patch-stop-times-txt \
	flex-rules.js gtfs/{routes,trips,stops,stop_times}.txt \
	| sponge gtfs/stop_times.txt
```


## Contributing

If you have a question or need support using `generate-herrenberg-gtfs-flex`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/generate-herrenberg-gtfs-flex/issues).
