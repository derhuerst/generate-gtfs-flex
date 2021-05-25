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
    generate-booking-rules-txt <path-to-flex-rules> <gtfs-routes>
Examples:
    generate-booking-rules-txt flex-rules.js gtfs/routes.txt >gtfs/booking_rules.txt
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
const computeAllBookingRules = require('./lib/booking-rules')

const pathToFlexRules = argv._[0]
if (!pathToFlexRules) showError('Missing path-to-flex-rules.')
const flexRules = require(resolve(process.cwd(), pathToFlexRules))

const requiredGtfsFiles = [
	'routes'
]
const readGtfsFile = createReadGtfsFile(requiredGtfsFiles, argv._.slice(1))

;(async () => {
	const bookingRules = await computeAllBookingRules(flexRules, readGtfsFile)

	const fields = new Set()
	for (const [_, br] of bookingRules.entries()) {
		for (const k of Object.keys(br)) fields.add(k)
	}
	const csv = new Stringifier({
		quoted: true,
		columns: Array.from(fields.values()),
		header: true,
	})
	csv.pipe(process.stdout)

	for (const [_, br] of bookingRules.entries()) {
		const row = []
		let i = 0
		for (const field of fields) {
			row[i++] = br[field]
		}
		csv.write(row)
	}
	csv.end()
})()
.catch(showError)
