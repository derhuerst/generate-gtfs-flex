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
const {Stringifier} = require('csv-stringify')
const readCsv = require('gtfs-utils/read-csv')
const circle = require('@turf/circle').default
const truncate = require('@turf/truncate').default

// todo: make this an argument
const herrenbergCitybus = {
	radius: .3, // in km, for the generated location area
	bookingRule: {
		booking_rule_id: 'herrenberg-citybus',
		pickup_type: pickupTypes.MUST_PHONE_AGENCY,
		drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
		booking_type: bookingTypes.SAME_DAY,
		prior_notice_duration_min: 30,
		phone_number: '+49 7032 92029',
		message: `\
	- Haustürbedienung beim Absetzen 300m (Luftlinie) um die Haltestelle.
	- Aufpreis 0,80€ direkt an den Taxi Fahrer`,
		info_url: 'https://stadtwerke.herrenberg.de/oepnv-parken/oepnv/weitere-informationen/',
	},
}
const rufbusse = new Map([
	['RT779', herrenbergCitybus],
	['RT780', herrenbergCitybus],
	['RT782', herrenbergCitybus],
	['RT783', herrenbergCitybus],
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
	const bookingRules = new Map()
	for (const [_, {bookingRule: br}] of rufbusse) {
		bookingRules.set(br.booking_rule_id, br)
	}

	// todo: this doesn't escape multiline values, is that correct?
	const csv = new Stringifier({quoted: true})
	const printCsv = (row) => {
		process.stdout.write(csv.stringify(row) + '\n')
	}

	const fields = new Set()
	for (const [_, br] of bookingRules) {
		for (const k of Object.keys(br)) fields.add(k)
	}
	printCsv(Array.from(fields.values())) // header

	for (const [_, br] of bookingRules) {
		const row = []
		let i = 0
		for (const field of fields) {
			row[i++] = br[field]
		}
		printCsv(row)
	}

	const byRouteId = new Map() // route_id -> rufbus spec
	for await (const r of readCsv(files.routes)) {
		if (rufbusse.has(r.route_short_name)) {
			const spec = rufbusse.get(r.route_short_name)
			byRouteId.set(r.route_id, spec)
		}
	}

	const byTripId = new Map()
	for await (const t of readCsv(files.trips)) {
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
