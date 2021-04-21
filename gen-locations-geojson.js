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
    generate-locations-geojson <path-to-rufbusse> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    generate-locations-geojson lib/rufbusse.js \\
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/locations.geojson
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

const {join, basename, extname} = require('path')
const readCsv = require('gtfs-utils/read-csv')
const circle = require('@turf/circle').default
const truncate = require('@turf/truncate').default

const pathToRufbusse = argv._[0]
if (!pathToRufbusse) {
	showError('Missing path-to-booking-rules.')
}
const rufbusse = require(join(process.cwd(), pathToRufbusse))

const gtfs = new Map()
for (const path of argv._) {
	const name = basename(path, extname(path))
	gtfs[name] = path
}
if (!gtfs.routes) showError('Missing routes.txt file.')
if (!gtfs.trips) showError('Missing trips.txt file.')
if (!gtfs.stops) showError('Missing stops.txt file.')
if (!gtfs['stop_times']) showError('Missing stop_times.txt file.')

;(async () => {
	const byRouteId = new Map() // route_id -> rufbus spec
	for await (const r of readCsv(gtfs.routes)) {
		if (rufbusse.has(r.route_short_name)) {
			const spec = rufbusse.get(r.route_short_name)
			byRouteId.set(r.route_id, spec)
		}
	}

	const byTripId = new Map()
	for await (const t of readCsv(gtfs.trips)) {
		if (byRouteId.has(t.route_id)) {
			const {
				bookingRule,
				radius,
			} = byRouteId.get(t.route_id)
			byTripId.set(t.trip_id, {
				bookingRule,
				radius,
				stops: new Set(),
			})
		}
	}

	const allStops = new Map()
	for await (const s of readCsv(gtfs.stops)) {
		allStops.set(s.stop_id, s)
	}

	for await (const st of readCsv(gtfs['stop_times'])) {
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

	for (const [trip_id, spec] of byTripId) {
		const {
			bookingRule,
			radius,
			stops,
		} = spec
		for (const s of stops) {
			const locId = [
				bookingRule.booking_rule_id,
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
					circle([s.stop_lon, s.stop_lat], radius, {steps: 32, properties}),
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
