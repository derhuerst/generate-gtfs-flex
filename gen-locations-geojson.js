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
    generate-locations-geojson <path-to-flex-rules> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    generate-locations-geojson flex-rules.js \\
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

const {resolve} = require('path')
const circle = require('@turf/circle').default
const truncate = require('@turf/truncate').default
const createReadGtfsFile = require('./lib/read-gtfs-files')
const {computeFlexSpecsWithStopsByTripId} = require('./lib/flex-specs-by-trip-id')
const {generateFlexLocationId: flexLocId} = require('./lib/ids')

const pathToFlexRules = argv._[0]
if (!pathToFlexRules) showError('Missing path-to-flex-rules.')
const flexRules = require(resolve(process.cwd(), pathToFlexRules))

const requiredGtfsFiles = [
	'routes',
	'trips',
	'stops',
	'stop_times',
]
const readGtfsFile = createReadGtfsFile(requiredGtfsFiles, argv._.slice(1))

;(async () => {
	const byTripId = await computeFlexSpecsWithStopsByTripId(flexRules, readGtfsFile)

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
			id: specId,
			radius,
			stops,
		} = spec
		for (const s of stops) {
			const locId = flexLocId(specId, s.stop_id)
			if (printedLocs.has(locId)) continue

			const properties = {
				// We duplicate the name here because some downstream tools need it.
				name: s.stop_name || null,
				stop_name: s.stop_name || null,
				stop_desc: s.stop_desc || null,
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
