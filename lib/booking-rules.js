'use strict'

const validateFlexSpec = require('./validate-flex-spec')

const computeAllBookingRules = async (flexRules, readGtfsFile) => {
	const bookingRulesById = new Map() // booking_rule_id -> booking rule

	for await (const r of await readGtfsFile('routes')) {
		// find any matching GTFS-Flex rule
		for (const flexRule of flexRules) {
			const flexSpec = flexRule(r)
			if (flexSpec) {
				validateFlexSpec(flexSpec)
				const {bookingRule} = flexSpec
				bookingRulesById.set(bookingRule.booking_rule_id, bookingRule)
				break
			}
		}
	}

	return bookingRulesById
}

module.exports = computeAllBookingRules
