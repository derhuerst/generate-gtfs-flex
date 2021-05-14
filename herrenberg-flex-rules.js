'use strict'

const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const bookingTypes = require('gtfs-utils/booking-types')

const herrenbergCitybusFlex = {
	id: 'herrenberg-citybus-300m',
	radius: .3, // in km, for the generated location area
	pickup_type: pickupTypes.MUST_PHONE_AGENCY,
	drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
	bookingRule: {
		booking_rule_id: 'herrenberg-citybus',
		booking_type: bookingTypes.SAME_DAY,
		prior_notice_duration_min: 30,
		message: `\
Anmeldung bis 30min vor Abfahrt.`,
		drop_off_message: `\
Haustürbedienung beim Absetzen 300m (Luftlinie) um die Haltestelle. Aufpreis 0,80€ direkt an den Taxi-Fahrer.`,
		phone_number: '+49 7032 92029',
		info_url: 'https://stadtwerke.herrenberg.de/oepnv-parken/oepnv/weitere-informationen/',
	},
}
const herrenbergCitybusRoutes = ['RT779', 'RT780', 'RT782', 'RT783']
const herrenbergCitybus = (origRoute) => (
	herrenbergCitybusRoutes.includes(origRoute.route_short_name)
		? herrenbergCitybusFlex
		: null
)

const regionalbusFlex = {
	// todo: is 300m correct?
	id: 'regionalbus-300m',
	radius: .3, // in km, for the generated location area
	pickup_type: pickupTypes.MUST_PHONE_AGENCY,
	drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
	bookingRule: {
		booking_rule_id: 'regionalbus',
		booking_type: bookingTypes.SAME_DAY,
		prior_notice_duration_min: 30,
		message: `\
Anmeldung bis 30min vor Abfahrt. Bitte Rahmenbedingungen mit Fr. Schmauderer Landkreis Böblingen 07031 / 663 - 15 03 verifizieren.`,
		drop_off_message: `\
Haustürbeförderung beim Absetzen. Aufpreis 1€.`,
		phone_number: '+49 7032 95 97 37',
		info_url: 'https://stadtwerke.herrenberg.de/oepnv-parken/oepnv/weitere-informationen/',
	},
}
const regionalbusRoutes = ['RT753', 'RT773', 'RT775', 'RT791', 'RT794']
const regionalbus = (origRoute) => (
	// todo: add line-specific contact details
	// todo: do all of these have drop-off at home?
	regionalbusRoutes.includes(origRoute.route_short_name)
		? regionalbusFlex
		: null
)

const herrenbergFlexRules = [
	herrenbergCitybus,
	regionalbus,
	// todo: more lines?
	// todo: what about e.g. "RT77" `51-77-j21-1`? pdf fahrplan doesn't show on-demand stops
]

module.exports = herrenbergFlexRules
