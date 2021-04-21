'use strict'

const pickupTypes = require('gtfs-utils/pickup-types')
const dropOffTypes = require('gtfs-utils/drop-off-types')
const bookingTypes = require('gtfs-utils/booking-types')

const herrenbergCitybus = {
	radius: .3, // in km, for the generated location area
	bookingRule: {
		booking_rule_id: 'herrenberg-citybus',
		pickup_type: pickupTypes.MUST_PHONE_AGENCY,
		drop_off_type: dropOffTypes.MUST_COORDINATE_WITH_DRIVER,
		booking_type: bookingTypes.SAME_DAY,
		prior_notice_duration_min: 30,
		phone_number: '+49 7032 92029',
		message: `\
	- Haustürbedienung beim Absetzen 300m (Luftlinie) um die Haltestelle.
	- Aufpreis 0,80€ direkt an den Taxi Fahrer`,
		info_url: 'https://stadtwerke.herrenberg.de/oepnv-parken/oepnv/weitere-informationen/',
	},
}
const rufbusse = new Map([
	['RT779', herrenbergCitybus],
	['RT780', herrenbergCitybus],
	['RT782', herrenbergCitybus],
	['RT783', herrenbergCitybus],
	// todo: more lines
])

module.exports = rufbusse
