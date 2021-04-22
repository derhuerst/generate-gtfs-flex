'use strict'

const computeBookingRulesByTripId = async (rufbusse, readGtfsFile) => {
	const byRouteId = new Map() // route_id -> rufbus spec
	for await (const r of readGtfsFile('routes')) {
		if (rufbusse.has(r.route_short_name)) {
			const spec = rufbusse.get(r.route_short_name)
			byRouteId.set(r.route_id, spec)
		}
	}

	const byTripId = new Map()
	for await (const t of readGtfsFile('trips')) {
		if (byRouteId.has(t.route_id)) {
			const spec = byRouteId.get(t.route_id)
			byTripId.set(t.trip_id, spec)
		}
	}

	return byTripId
}

module.exports = computeBookingRulesByTripId
