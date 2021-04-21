#!/usr/bin/env node
'use strict'

const mri = require('mri')
const pkg = require('./package.json')

const argv = mri(process.argv.slice(2), {
	boolean: [
		'help', 'h',
		'version', 'v',
	]
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    generate-locations-geojson todo
Options:
	todo
Examples:
	todo
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`${pkg.name} v${pkg.version}\n`)
	process.exit(0)
}

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const {basename, extname} = require('path')
const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const bookingTypes = require('gtfs-utils/booking-types')
const readCsv = require('gtfs-utils/read-csv')
const circle = require('@turf/circle').default
const truncate = require('@turf/truncate').default

// todo: make this an argument
const herrenberg = {
	idPrefix: 'herrenberg-300', // prefix for locations.geojson IDs
	pickup_type: pickupTypes.MUST_PHONE_AGENCY,
	drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
	booking_type: bookingTypes.SAME_DAY,
	radius: .3, // in km, for the generated location area
	prior_notice_duration_min: 30,
	phone_number: '+49 7032 92029',
	message: `\
- Haustürbedienung beim Absetzen 300m (Luftlinie) um die Haltestelle.
- Aufpreis 0,80€ direkt an den Taxi Fahrer`,
	info_url: 'https://stadtwerke.herrenberg.de/oepnv-parken/oepnv/weitere-informationen/',
}
const rufbusse = new Map([
	['RT779', {
		...herrenberg,
	}],
	['RT780', {
		...herrenberg,
	}],
	['RT782', {
		...herrenberg,
	}],
	['RT783', {
		...herrenberg,
	}],
	// todo: more lines
])

const files = new Map()
for (const path of argv._) {
	const name = basename(path, extname(path))
	files[name] = path
}
if (!files.routes) showError('Missing routes.txt file.')
if (!files.trips) showError('Missing trips.txt file.')
if (!files.stops) showError('Missing stops.txt file.')
if (!files['stop_times']) showError('Missing stop_times.txt file.')

;(async () => {

	const byRouteId = new Map() // route_id -> locSpec
	for await (const r of readCsv(files.routes)) {
		if (rufbusse.has(r.route_short_name)) {
			const locSpec = rufbusse.get(r.route_short_name)
			byRouteId.set(r.route_id, locSpec)
		}
	}

	const byTripId = new Map()
	for await (const t of readCsv(files.trips)) {
		if (byRouteId.has(t.route_id)) {
			const locSpec = byRouteId.get(t.route_id)
			byTripId.set(t.trip_id, {
				locSpec,
				stops: new Set(),
			})
		}
	}

	const allStops = new Map()
	for await (const s of readCsv(files.stops)) {
		allStops.set(s.stop_id, s)
	}

	for await (const st of readCsv(files['stop_times'])) {
		if (!byTripId.has(st.trip_id)) continue
		if (!allStops.has(st.stop_id)) continue

		const {stops} = byTripId.get(st.trip_id)
		stops.add(allStops.get(st.stop_id))
	}

	process.stdout.write(`\
{
	"type": "FeatureCollection",
	"features": [
`)
	let first = true
	const printLoc = (loc) => {
		if (first) first = false
		else process.stdout.write(',')
		process.stdout.write(JSON.stringify(loc) + '\n')
	}
	const printedLocs = new Set()

	for (const [trip_id, {locSpec, stops}] of byTripId) {
		for (const s of stops) {
			const locId = [
				locSpec.idPrefix,
				s.stop_id,
			].join('-')
			if (printedLocs.has(locId)) continue

			const properties = {
				// todo: stop_name?
				// todo: stop_desc?
				// todo: stop_url?
			}
			printLoc({
				id: locId, // todo: why not insde `properties`? double-check spec again
				...truncate(
					circle([s.stop_lon, s.stop_lat], locSpec.radius, {steps: 32, properties}),
					{precision: 5, mutate: true},
				),
			})
			printedLocs.add(locId)
		}
	}

	process.stdout.write(`\
	]
}
`)
})()
.catch(showError)
