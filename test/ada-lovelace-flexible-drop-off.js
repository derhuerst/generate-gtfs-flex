'use strict'

const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const bookingTypes = require('gtfs-utils/booking-types')

const adaLovelaceFlexibleDropOff = (route) => {
	if (route.route_id !== 'A') return null // leave route unchanged
	return {
		id: 'A-flexible-drop-off', // ID of the GTFS-Flex spec
		radius: .200, // flexible drop-off within 200m of a stop
		pickup_type: pickupTypes.MUST_PHONE_AGENCY,
		drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
		bookingRule: {
			booking_rule_id: 'flexible-drop-off',
			booking_type: bookingTypes.SAME_DAY,
			prior_notice_duration_min: 30,
			message: 'Get dropped off right at home! Please call 30min before.',
			booking_url: 'https://example.org/flex'
		},
	}
}

module.exports = [
	adaLovelaceFlexibleDropOff,
]
