'use strict'

const Ajv = require('ajv')
const {doesNotThrow, throws} = require('assert')
const flexSpecSchema = require('./flex-spec-schema.json')

const validate = new Ajv().compile(flexSpecSchema)

const validateFlexSpec = (flexSpec) => {
	const valid = validate(flexSpec)
	if (!valid) {
		const err = new Error('invalid GTFS-Flex spec')
		err.flexSpec = flexSpec
		err.validationErrors = validate.errors
		throw err
	}
}

const herrenbergCitybus = {
	id: 'herrenberg-citybus-300m',
	radius: .3, // in km, for the generated location area
	pickup_type: 2,
	drop_off_type: 3,
	bookingRule: {
		booking_rule_id: 'herrenberg-citybus',
		booking_type: 1,
		prior_notice_duration_min: 30,
		message: `\
Anmeldung bis 30min vor Abfahrt.`,
		drop_off_message: `\
Haustürbedienung beim Absetzen 300m (Luftlinie) um die Haltestelle. Aufpreis 0,80€ direkt an den Taxi-Fahrer.`,
		phone_number: '+49 7032 92029',
		info_url: 'https://stadtwerke.herrenberg.de/oepnv-parken/oepnv/weitere-informationen/',
	},
}

// todo: add a bbnavi flex spec

doesNotThrow(() => {
	validateFlexSpec(herrenbergCitybus)
})
throws(() => {
	validateFlexSpec({
		...herrenbergCitybus,
		radius: 'foo',
	})
}, 'should throw on invalid FlexSpec.radius')
throws(() => {
	validateFlexSpec({
		...herrenbergCitybus,
		bookingRule: {
			...herrenbergCitybus.bookingRule,
			booking_type: 'foo',
		}
	})
}, 'should throw on invalid FlexSpec.bookingRule.booking_type')

module.exports = validateFlexSpec
