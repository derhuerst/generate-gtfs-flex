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
    generate-booking-rules-txt <path-to-booking-rules>
Examples:
	generate-booking-rules-txt lib/booking-rules.js >gtfs/booking_rules.txt
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

const pathToBookingRules = argv._[0]
if (!pathToBookingRules) {
	showError('Missing path-to-booking-rules.')
}
const bookingRules = require(resolve(process.cwd(), pathToBookingRules))

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
