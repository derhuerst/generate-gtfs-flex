# generate-gtfs-flex

Given a [GTFS Static](https://gtfs.org/reference/static) feed, **add [GTFS Flex v2](https://github.com/MobilityData/gtfs-flex/blob/e1832cfea5ddb9df29bd2fc50e80b0a4987695c1/spec/reference.md) to model on-demand public transport service.**

[![ISC-licensed](https://img.shields.io/github/license/derhuerst/generate-gtfs-flex.svg)](license.md)

This tool has originally developed for [Stadtnavi Herrenberg](https://herrenberg.stadtnavi.de), but it is used by other projects as well.

*Note:* In order to get the behaviour we want (pickup only at stops but flexible drop-off within 300m), **we currently don't follow the spec as intended**; See [#5](https://github.com/derhuerst/generate-gtfs-flex/issues/5) and [#6](https://github.com/derhuerst/generate-gtfs-flex/pull/6) for details.


## Installation

```shell
npm install derhuerst/generate-gtfs-flex
# or
docker pull derhuerst/generate-gtfs-flex
```


## Getting started

The scripts in this repo are written to be used with any GTFS feed; They need a *rule file* that describes which GTFS Static routes to patch with GTFS Flex information.

In addition, there are *rule files* for some projects that use this tool:

- [`stadtnavi-herrenberg-flex-rules.js`](stadtnavi-herrenberg-flex-rules.js) – specifies the on-demand lines in [Herrenberg, Germany](https://en.wikipedia.org/wiki/Herrenberg) (part of [VVS](https://www.vvs.de)), used by [Stadtnavi Herrenberg](https://herrenberg.stadtnavi.de).

The following steps will demonstrate how to use `generate-gtfs-flex` with `stadtnavi-herrenberg-flex-rules.js`. You must have [Node.js](https://nodejs.org/) installed (which includes the [`npm` CLI](https://docs.npmjs.com/cli/v7)).

```bash
# set up an empty npm project
mkdir flex
cd flex
npm init --yes

# download and unzip 2022-01-17 VVS GTFS feed
# get the latest feed at https://www.opendata-oepnv.de/ht/de/organisation/verkehrsverbuende/vvs/startseite?tx_vrrkit_view%5Bdataset_name%5D=soll-fahrplandaten-vvs&tx_vrrkit_view%5Bdataset_formats%5D%5B0%5D=ZIP&tx_vrrkit_view%5Baction%5D=details&tx_vrrkit_view%5Bcontroller%5D=View
wget 'https://www.opendata-oepnv.de/dataset/d1768457-c717-45ea-8e26-dd1e759d5ffe/resource/ebc2eaae-9a03-4ace-8df7-28df10a80993/download/google_transit.zip' -O vvs.gtfs.zip
unzip -d vvs-gtfs vvs.gtfs.zip

# install generate-gtfs-flex as a development dependency
npm install --save-dev derhuerst/generate-gtfs-flex

# patch GTFS-Flex data into the VVS GTFS feed
./node_modules/.bin/generate-locations-geojson \
	node_modules/generate-gtfs-flex/stadtnavi-herrenberg-flex-rules.js \
	vvs-gtfs/{routes,trips,stops,stop_times}.txt \
	>vvs-gtfs/locations.geojson
./node_modules/.bin/generate-booking-rules-txt \
	node_modules/generate-gtfs-flex/stadtnavi-herrenberg-flex-rules.js \
	vvs-gtfs/{routes,trips}.txt \
	>vvs-gtfs/booking_rules.txt
./node_modules/.bin/patch-trips-txt \
	node_modules/generate-gtfs-flex/stadtnavi-herrenberg-flex-rules.js \
	vvs-gtfs/{routes,trips,stops,stop_times}.txt \
	| sponge vvs-gtfs/trips.txt
./node_modules/.bin/patch-routes-txt \
	node_modules/generate-gtfs-flex/stadtnavi-herrenberg-flex-rules.js \
	vvs-gtfs/{routes,trips}.txt \
	| sponge vvs-gtfs/routes.txt
./node_modules/.bin/patch-stop-times-txt \
	node_modules/generate-gtfs-flex/stadtnavi-herrenberg-flex-rules.js \
	vvs-gtfs/{routes,trips,stops,stop_times}.txt \
	| sponge vvs-gtfs/stop_times.txt
```

*pro tip:* If you install the package globally (via `npm install derhuerst/generate-gtfs-flex -g`), npm will put the scripts into your [`$PATH`](https://en.wikipedia.org/wiki/PATH_(variable)), so instead of running `./node_modules/.bin/…`, you'll be able to just use them as documented below.


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
    patch-routes-txt <path-to-flex-rules> <gtfs-routes>
Examples:
    patch-routes-txt flex-rules.js gtfs/routes.txt >gtfs/routes.patched.txt
```

```
Usage:
    patch-trips-txt <path-to-flex-rules> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    patch-trips-txt flex-rules.js \
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/trips.patched.txt
```

```
Usage:
    patch-stop-times-txt <path-to-flex-rules> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    patch-stop-times-txt flex-rules.js \
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/stop_times.patched.txt
```

*Note:* Currently, `generate-gtfs-flex` inserts all trips & `stop_times` rows affected by any of the rules *twice*: One on-demand trip stopping directly at the stops, one trip stopping at Flex areas.

### with Docker

You can use the [`derhuerst/generate-gtfs-flex` Docker image](https://hub.docker.com/r/derhuerst/generate-gtfs-flex). It will call the tools documented above on a GTFS feed that you mount into the container.

- You need to specify the *rule file* (see above) to use, either a relative path to a bundled *rule file* or an absolute path to you own.
- Optionally, you can pass the path of the GTFS directory (default is `/gtfs`).

```shell
# with a bundled rule file
docker run \
	-v /path/to/gtfs:/gtfs \
	--rm -it derhuerst/generate-gtfs-flex
# with your own rule file & custom GTFS directory
docker run \
	-v $PWD:/cfg -v /path/to/my-gtfs:/my-gtfs \
	--rm -it derhuerst/generate-gtfs-flex \
	/cfg/my-flex-rules.js /my-gtfs
```

**⚠️ This will overwrite the original `routes.txt`, `trips.txt` & `stop_times.txt` files.**


### with your own GTFS feed & GTFS-Flex rules

You can use the scripts in this repo with *any* GTFS feed. As an example, we're going to patch [`sample-gtfs-feed`](https://github.com/public-transport/sample-gtfs-feed)'s `A` ("Ada Lovelace Bus Line") route to have flexible on-demand drop-offs.

```shell
# as above, initialise an empty npm project & install generate-gtfs-flex
mkdir sample-gtfs-feed-with-flex
cd sample-gtfs-feed-with-flex
npm init --yes
npm install --save-dev sample-gtfs-feed derhuerst/generate-gtfs-flex
```

We're going to write a file `flex-rules.js` that exports a list of GTFS-Flex *rules*. Each of these rules is a function that must, when given a `routes.txt` entry/row, return either `null` to leave it unchanged or return a GTFS-Flex *spec* (check out [the schema](lib/flex-spec-schema.json)) to patch it:

```js
const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const bookingTypes = require('gtfs-utils/booking-types')

const adaLovelaceFlexibleDropOff = (route) => {
	if (route.route_id !== 'A') return null // leave route unchanged
	return {
		id: 'A-flexible-drop-off', // ID of the GTFS-Flex spec
		radius: .200, // flexible drop-off within 200m of a stop
		pickup_type: pickupTypes.MUST_PHONE_AGENCY,
		drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
		bookingRule: {
			// ID of the GTFS-BookingRules booking_rules.txt entry/row to be generated
			booking_rule_id: 'flexible-drop-off',
			booking_type: bookingTypes.SAME_DAY,
			prior_notice_duration_min: 30,
			message: 'Get dropped off right at home! Please call 30min before.',
			booking_url: 'https://example.org/flex'
		},
	}
}

module.exports = [
	adaLovelaceFlexibleDropOff,
]
```

We can now patch the GTFS-Flex *rules* into `sample-gtfs-feed`'s GTFS feed:

```shell
# copy the GTFS feed first, so that we don't mutate node_modules
cp -r node_modules/sample-gtfs-feed/gtfs gtfs

./node_modules/.bin/generate-locations-geojson \
	flex-rules.js gtfs/{routes,trips,stops,stop_times}.txt \
	>gtfs/locations.geojson
./node_modules/.bin/generate-booking-rules-txt \
	flex-rules.js gtfs/{routes,trips}.txt \
	>gtfs/booking_rules.txt
./node_modules/.bin/patch-routes-txt \
	flex-rules.js gtfs/{routes,trips}.txt \
	| sponge gtfs/routes.txt
./node_modules/.bin/patch-trips-txt \
	flex-rules.js gtfs/{routes,trips,stops,stop_times}.txt \
	| sponge gtfs/trips.txt
./node_modules/.bin/patch-stop-times-txt \
	flex-rules.js gtfs/{routes,trips,stops,stop_times}.txt \
	| sponge gtfs/stop_times.txt
```


## Contributing

If you have a question or need support using `generate-gtfs-flex`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/generate-gtfs-flex/issues).
