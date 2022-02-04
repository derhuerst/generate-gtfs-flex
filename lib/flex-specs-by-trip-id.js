'use strict'

const validateFlexSpec = require('./validate-flex-spec')

const computeFlexSpecsByRouteId = async (flexRules, readGtfsFile) => {
	const flexSpecsByRouteId = new Map() // route_id -> GTFS-Flex spec

	for await (const r of await readGtfsFile('routes')) {
		// find any matching GTFS-Flex rule
		for (const flexRule of flexRules) {
			const flexSpec = flexRule(r)
			if (flexSpec) {
				validateFlexSpec(flexSpec)
				flexSpecsByRouteId.set(r.route_id, flexSpec)
				break
			}
		}
	}

	return flexSpecsByRouteId
}

const computeFlexSpecsByTripId = async (flexRules, readGtfsFile) => {
	const byRouteId = await computeFlexSpecsByRouteId(flexRules, readGtfsFile)

	const byTripId = new Map()
	for await (const t of await readGtfsFile('trips')) {
		if (byRouteId.has(t.route_id)) {
			const flexSpec = byRouteId.get(t.route_id)
			byTripId.set(t.trip_id, flexSpec)
		}
	}

	return byTripId
}

const computeFlexSpecsWithStopsByTripId = async (flexRules, readGtfsFile) => {
	const byTripId = await computeFlexSpecsByTripId(flexRules, readGtfsFile)
	const withStopsByTripId = new Map()
	for (const [tripId, flexSpec] of byTripId.entries()) {
		withStopsByTripId.set(tripId, {
			...flexSpec,
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
	computeFlexSpecsByRouteId,
	computeFlexSpecsByTripId,
	computeFlexSpecsWithStopsByTripId,
}
