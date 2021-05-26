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
    generate-location-groups-txt <path-to-flex-rules> <gtfs-routes> <gtfs-trips> <gtfs-stops> <gtfs-stop-times>
Examples:
    generate-location-groups-txt flex-rules.js \\
        gtfs/{routes,trips,stops,stop_times}.txt >gtfs/location_groups.txt
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
const {Stringifier} = require('csv-stringify')
const createReadGtfsFile = require('./lib/read-gtfs-files')
const {computeFlexSpecsWithStopsByTripId} = require('./lib/flex-specs-by-trip-id')
const {
	generateLocationGroupId,
	generateFlexLocationId,
} = require('./lib/ids')

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

	const csv = new Stringifier({
		quoted: true,
		header: true,
		columns: ['location_group_id', 'location_id'],
	})
	csv.pipe(process.stdout)

	const printedLocGroups = new Set()
	for (const [trip_id, flexSpec] of byTripId) {
		const {
			id: flexSpecId,
			stops,
		} = flexSpec
		for (const s of stops) {
			const locGroupId = generateLocationGroupId(flexSpecId, s.stop_id)
			if (printedLocGroups.has(locGroupId)) continue

			csv.write([locGroupId, s.stop_id])
			const flexLocId = generateFlexLocationId(flexSpecId, s.stop_id)
			csv.write([locGroupId, flexLocId])

			printedLocGroups.add(locGroupId)
		}
	}
	csv.end()
})()
.catch(showError)
