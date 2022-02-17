'use strict'


const validateFlexSpec = require('./validate-flex-spec')

const computeFlexSpecsByTripId = async (flexRules, readGtfsFile) => {
	const routes = new Map() // route_id -> route
	for await (const r of await readGtfsFile('routes')) {
		routes.set(r.route_id, r)
	}

	const byTripId = new Map() // trip_id -> [flexSpec, route]
	for await (const t of await readGtfsFile('trips')) {
		if (!routes.has(t.route_id)) continue
		const route = routes.get(t.route_id)

		// find any matching GTFS-Flex rule
		for (const flexRule of flexRules) {
			const flexSpec = flexRule(t, route)
			if (flexSpec) {
				validateFlexSpec(flexSpec)
				byTripId.set(t.trip_id, [flexSpec, route])
				break
			}
		}
	}

	return byTripId
}

const computeFlexSpecsWithStopsByTripId = async (flexRules, readGtfsFile) => {
	const byTripId = await computeFlexSpecsByTripId(flexRules, readGtfsFile)

	const withStopsByTripId = new Map()
	for (const [tripId, [flexSpec, route]] of byTripId.entries()) {
		withStopsByTripId.set(tripId, {
			...flexSpec,
			route,
			stops: new Set(),
		})
	}

	const allStops = new Map()
	for await (const s of await readGtfsFile('stops')) {
		allStops.set(s.stop_id, s)
	}

	for await (const st of await readGtfsFile('stop_times')) {
		if (!withStopsByTripId.has(st.trip_id)) continue
		if (!allStops.has(st.stop_id)) continue

		const {stops} = withStopsByTripId.get(st.trip_id)
		stops.add(allStops.get(st.stop_id))
	}

	return withStopsByTripId
}

module.exports = {
	computeFlexSpecsByTripId,
	computeFlexSpecsWithStopsByTripId,
}
