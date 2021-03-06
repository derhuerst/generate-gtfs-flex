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
    patch-routes-txt <path-to-flex-rules> <gtfs-routes>
Examples:
    patch-routes-txt flex-rules.js gtfs/routes.txt >gtfs/routes.patched.txt
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
// const addSeconds = require('./lib/add-seconds')
const {computeFlexSpecsByRouteId} = require('./lib/flex-specs-by-trip-id')
// const {
// 	generateFlexTripId: flexTripId,
// } = require('./lib/ids')

// https://developers.google.com/transit/gtfs/reference/extended-route-types
const DEMAND_AND_RESPONSE_BUS = 715

const pathToFlexRules = argv._[0]
if (!pathToFlexRules) showError('Missing path-to-flex-rules.')
const flexRules = require(resolve(process.cwd(), pathToFlexRules))

const requiredGtfsFiles = [
	'routes',
]
const readGtfsFile = createReadGtfsFile(requiredGtfsFiles, argv._.slice(1))

;(async () => {
	const byRouteId = await computeFlexSpecsByRouteId(flexRules, readGtfsFile)

	const csv = new Stringifier({
		quoted: true,
		header: true,
	})
	csv.pipe(process.stdout)

	// pass through all routes, patch Flex routes as on-demand
	for await (const t of readGtfsFile('routes')) {
		if (byRouteId.has(t.route_id)) {
			t.route_type = DEMAND_AND_RESPONSE_BUS
		}
		csv.write(t)
	}

	csv.end()
})()
.catch(showError)
