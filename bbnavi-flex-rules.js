'use strict'

// These are the GTFS-Flex patching rules used by bbnavi (https://bbnavi.de).

const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const bookingTypes = require('gtfs-utils/booking-types')

const uvgLinienrufbusFlexSpec = {
	id: 'uvg-linienrufbus',
	pickup_type: pickupTypes.MUST_PHONE_AGENCY,
	drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
	bookingRule: {
		booking_rule_id: 'uvg-linienrufbus',
		booking_type: bookingTypes.SAME_DAY,
		prior_notice_duration_min: 60,
		message: `\
Anmeldung bis 60min vor Abfahrt, per Telefon (täglich von 08:00-24:00) oder online.`,
		phone_number: '+49 3332 442 755',
		// todo: separate flex specs for Angermünde & Gartz?
		// https://uvg-online.com/rufbus-angermuende/
		// https://uvg-online.com/rufbus-gartz/
		info_url: 'https://uvg-online.com/rufbus/',
	},
}
const uvgLinienrufbusRoutes = [
	'459',
	// todo: there are more
]
const uvgLinienrufbus = (origTrip, origRoute) => (
	// todo: how do we distinguish Rufbus trips from regular trips?
	// currently neither the DELFI GTFS nor the VBB GTFS provide a discerning field
	uvgLinienrufbusRoutes.includes(origRoute.route_short_name)
		? uvgLinienrufbusFlexSpec
		: null
)

const bbnaviFlexRules = [
	uvgLinienrufbus,
]

module.exports = bbnaviFlexRules
