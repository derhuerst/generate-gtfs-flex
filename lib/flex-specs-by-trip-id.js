'use strict'

const computeFlexSpecsByRouteId = async (flexRules, readGtfsFile) => {
	const flexSpecsByRouteId = new Map() // route_id -> GTFS-Flex spec

	for await (const r of readGtfsFile('routes')) {
		// find any matching GTFS-Flex rule
		for (const flexRule of flexRules) {
			const flexSpec = flexRule(r)
			if (flexSpec) {
				flexSpecsByRouteId.set(r.route_id, flexSpec)
				break
			}
		}
	}

	return flexSpecsByRouteId
}

const computeBookingRulesByTripId = async (flexRules, readGtfsFile) => {
	const byRouteId = await computeFlexSpecsByRouteId(flexRules, readGtfsFile)

	const byTripId = new Map()
	for await (const t of readGtfsFile('trips')) {
		if (byRouteId.has(t.route_id)) {
			const flexSpec = byRouteId.get(t.route_id)
			byTripId.set(t.trip_id, flexSpec)
		}
	}

	return byTripId
}

module.exports = computeBookingRulesByTripId
