#!/usr/bin/env node
'use strict'

const assert = require('assert')
const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const addSeconds = require('./lib/add-seconds')

const timepointTypes = { // todo: move to gtfs-utils
	APPROXIMATE: 0,
	EXACT: 1,
}

const patchStopTime = (st, rufbusSpec) => {
	const {
		id: specId,
		pickup_type,
		drop_off_type,
		bookingRule,
	} = rufbusSpec
	const {
		arrival_time,
		departure_time,
	} = st

	st.timepoint = timepointTypes.APPROXIMATE

	// GTFS-FlexibleTrips
	// https://github.com/MobilityData/gtfs-flex/blob/e1832cfea5ddb9df29bd2fc50e80b0a4987695c1/spec/reference.md#stop_timestxt-file-extended

	st.stop_id = [ // todo: DRY with gen-locations-geojson.js
		specId,
		st.stop_id,
	].join('-')

	// `arrival_time`:
	// - Forbidden when `stop_times.stop_id` references a `location_groups.locationg_group_id` or an `id` from `locations.geojson`.
	// `departure_time`:
	// - Forbidden when `stop_times.stop_id` references a `location_groups.locationg_group_id` or an `id` from `locations.geojson`.
	st.arrival_time = null
	st.departure_time = null

	// `start_pickup_dropoff_window`:
	// Time that on-demand service becomes available in a GeoJSON location or location group.
	// - Required if `stop_times.stop_id` refers to `location_groups.location_group_id` or `id` from `locations.geojson`.
	// - Forbidden if `stop_times.stop_id` refers to `stops.stop_id`.
	// todo: smarter window calculation, e.g. depending on prev stop_time
	st.start_pickup_dropoff_window = addSeconds(arrival_time, -30)
	// `end_pickup_dropoff_window`
	// Time that on-demand service ends in a GeoJSON location or location group.
	// - Required if `stop_times.stop_id` refers to `location_groups.location_group_id` or `id` from `locations.geojson`.
	// - Forbidden if `stop_times.stop_id` refers to `stops.stop_id`.
	// todo: smarter window calculation, e.g. depending on prev stop_time
	st.end_pickup_dropoff_window = addSeconds(arrival_time, 30)

	// `pickup_type`:
	// `0` or empty - Regularly scheduled pickup.
	// `1` - No pickup available.
	// `2` - Must phone agency to arrange pickup.
	// `3` - Must coordinate with driver to arrange pickup.
	// - `pickup_type=0` forbidden for `stop_times.stop_id` referring to `location_groups.location_group_id` or `id` from `locations.geojson`.
	// - `pickup_type=3` forbidden for `location_groups.location_group_id` or `locations.geojson` that are not a single `LineString`.
	// - Optional otherwise.
	assert.ok((
		pickup_type !== pickupTypes.REGULAR &&
		pickup_type !== pickupTypes.MUST_COORDINATE_WITH_DRIVER
	), `\
rufbusSpec ${specId} has a pickup_type of ${pickup_type}, but it is forbidden for locations.geojson-based stop_times.`)
	st.pickup_type = pickup_type

	// `drop_off_type`:
	// `0` or empty - Regularly scheduled drop off.
	// `1` - No drop off available.
	// `2` - Must phone agency to arrange drop off.
	// `3` - Must coordinate with driver to arrange drop off.
	// - `drop_off_type=0` forbidden for `stop_times.stop_id` referring to `location_groups.location_group_id` or `id` from `locations.geojson`.
	// - Optional otherwise.
	assert.ok((
		drop_off_type !== dropOffTypes.REGULAR
	), `\
rufbusSpec ${specId} has a drop_off_type of ${drop_off_type}, but it is forbidden for locations.geojson-based stop_times.`)
	st.drop_off_type = drop_off_type

	// todo: add mean_duration_factor & mean_duration_offset?
	// todo: add safe_duration_factor & safe_duration_offset?

	// GTFS-BookingRules
	// https://github.com/MobilityData/gtfs-flex/blob/e1832cfea5ddb9df29bd2fc50e80b0a4987695c1/spec/reference.md#stop_timestxt-file-extended-1

	st.pickup_booking_rule_id = bookingRule.booking_rule_id
	st.drop_off_booking_rule_id = bookingRule.booking_rule_id
}

// todo
