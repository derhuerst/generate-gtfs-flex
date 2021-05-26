'use strict'

const generateFlexLocationId = (flexSpecId, stopId) => {
	return `${flexSpecId}-${stopId}-flex`
}

const generateFlexTripId = (originalTripId) => {
	return `${originalTripId}-flex`
}

module.exports = {
	generateFlexLocationId,
	generateFlexTripId,
}
