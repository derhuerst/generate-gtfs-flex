#!/bin/bash

set -e
set -o pipefail
cd "$(dirname $0)"

read -r -d '' parse_csv << EOF || :
const parse = require('csv-parser')
const parseCsv = async () => {
	const rows = []
	for await (const row of process.stdin.pipe(parse())) rows.push(row)
	return rows
};
EOF

read -r -d '' check_trips << EOF || :
const {ok, deepStrictEqual: deepEql} = require('assert')
;(async () => {
	const rows = await parseCsv()

	const origTrip = rows.find(st => st.trip_id === 'a-downtown-all-day')
	const flexTrip = rows.find(st => st.trip_id === 'a-downtown-all-day-flex')

	ok(origTrip, 'missing original trip')
	ok(flexTrip, 'missing Flex trip')
	deepEql(flexTrip, {
		...origTrip,
		trip_id: flexTrip.trip_id,
	}, 'Flex trip should be equal, except trip_id')

	console.info('trips looks good!')
})()
EOF

read -r -d '' check_stop_times << EOF || :
const {ok, strictEqual: eql} = require('assert')
;(async () => {
	const rows = await parseCsv()

	const origRow = rows.find(st => st.trip_id === 'a-downtown-all-day')
	const flexRow = rows.find(st => st.trip_id === 'a-downtown-all-day-flex')

	ok(origRow, 'missing original stop_times row(s)')
	ok(origRow.arrival_time, 'original stop_times row(s): arrival_time must not be empty')
	ok(flexRow, 'missing Flex stop_times row(s)')
	eql(flexRow.arrival_time, '', 'Flex stop_times row(s): arrival_time must be empty')
	eql(flexRow.pickup_type, '1', 'Flex stop_times row(s): pickup_type must be 1')
	eql(flexRow.drop_off_type, '3', 'Flex stop_times row(s): drop_off_type must be 3')
	eql(flexRow.pickup_booking_rule_id, 'flexible-drop-off', 'Flex stop_times row(s): pickup_booking_rule_id')

	console.info('stop_times looks good!')
})()
EOF

set -x

# todo: check routes.txt

../patch-trips-txt.js \
	ada-lovelace-flexible-drop-off.js \
	sample-gtfs-feed-0.10.3/{routes,trips,stops,stop_times}.txt \
	| node -e "$parse_csv$check_trips"

../patch-stop-times-txt.js \
	ada-lovelace-flexible-drop-off.js \
	sample-gtfs-feed-0.10.3/{routes,trips,stops,stop_times}.txt \
	| node -e "$parse_csv$check_stop_times"
