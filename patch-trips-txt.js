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
    patch-trips-txt <path-to-flex-rules> <gtfs-routes> <gtfs-trips>
Examples:
    patch-trips-txt flex-rules.js \\
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/trips.patched.txt
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
const assert = require('assert')
const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const {Stringifier} = require('csv-stringify')
const createReadGtfsFile = require('./lib/read-gtfs-files')
const addSeconds = require('./lib/add-seconds')
const {computeFlexSpecsByTripId} = require('./lib/flex-specs-by-trip-id')
const {
	generateFlexTripId: flexTripId,
} = require('./lib/ids')

const pathToFlexRules = argv._[0]
if (!pathToFlexRules) showError('Missing path-to-flex-rules.')
const flexRules = require(resolve(process.cwd(), pathToFlexRules))

const requiredGtfsFiles = [
	'routes',
	'trips',
]
const readGtfsFile = createReadGtfsFile(requiredGtfsFiles, argv._.slice(1))

;(async () => {
	const byTripId = await computeFlexSpecsByTripId(flexRules, readGtfsFile)

	const csv = new Stringifier({
		quoted: true,
		header: true,
	})
	csv.pipe(process.stdout)

	// pass through all trips, create Flex duplicates
	for await (const t of await readGtfsFile('trips')) {
		csv.write(t)

		if (byTripId.has(t.trip_id)) {
			// Flex/on-demand case, duplicate trip
			const t2 = {
				...t,
				trip_id: flexTripId(t.trip_id),
			}
			csv.write(t2)
		}
	}

	csv.end()
})()
.catch(showError)
