'use strict'

const computeAllBookingRules = async (flexRules, readGtfsFile) => {
	const bookingRulesById = new Map() // booking_rule_id -> booking rule

	for await (const r of readGtfsFile('routes')) {
		// find any matching GTFS-Flex rule
		for (const flexRule of flexRules) {
			const {bookingRule} = flexRule(r) || {}
			if (bookingRule) {
				bookingRulesById.set(bookingRule.booking_rule_id, bookingRule)
				break
			}
		}
	}

	return bookingRulesById
}

module.exports = computeAllBookingRules
