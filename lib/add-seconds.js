'use strict'

const parseGtfsTime = require('gtfs-utils/parse-time')
const {strictEqual} = require('assert')

// We can ignore timezones & DST switches here, because GTFS Time values
// are relative to noon - 12h.
// https://gist.github.com/derhuerst/574edc94981a21ef0ce90713f1cff7f6
const addSecondsToGtfsTime = (gtfsTime, secondsToAdd) => {
	let {hours, minutes, seconds} = parseGtfsTime(gtfsTime)

	const s = (
		hours * 3600 + minutes * 60 + seconds
		+ secondsToAdd
	)
	return [
		Math.floor(s / 3600),
		Math.floor((s % 3600) / 60),
		s % 60,
	].map(n => ('0' + n).slice(-2)).join(':')
}

strictEqual(addSecondsToGtfsTime('0:30', 10), '00:30:10')
strictEqual(addSecondsToGtfsTime('0:30:15', 10), '00:30:25')
strictEqual(addSecondsToGtfsTime('0:30:15', 45), '00:31:00')
strictEqual(addSecondsToGtfsTime('0:30:15', 125), '00:32:20')
strictEqual(addSecondsToGtfsTime('10:30:20', 10 * 3600 + 9 * 60 + 8), '20:39:28')
strictEqual(addSecondsToGtfsTime('30:20:10', -10 * 3600 - 9 * 60 - 8), '20:11:02')

module.exports = addSecondsToGtfsTime
