'use strict'

const validateFlexSpec = require('./validate-flex-spec')

const computeAllBookingRules = async (flexRules, readGtfsFile) => {
	const bookingRulesById = new Map() // booking_rule_id -> booking rule

	const routes = new Map() // route_id -> route
	for await (const r of await readGtfsFile('routes')) {
		routes.set(r.route_id, r)
	}

	for await (const t of await readGtfsFile('trips')) {
		if (!routes.has(t.route_id)) continue
		const route = routes.get(t.route_id)

		// find any matching GTFS-Flex rule
		for (const flexRule of flexRules) {
			const flexSpec = flexRule(t, route)
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
