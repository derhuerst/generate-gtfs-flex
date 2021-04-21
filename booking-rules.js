'use strict'

const rufbusse = require('./rufbusse')

const bookingRules = new Map()
for (const [_, {bookingRule: br}] of rufbusse) {
	bookingRules.set(br.booking_rule_id, br)
}

module.exports = bookingRules
