'use strict'

const generateFlexLocationId = (flexSpecId, stopId) => {
	return `${flexSpecId}-${stopId}-flex`
}

module.exports = {
	generateFlexLocationId,
}
