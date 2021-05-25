'use strict'

const generateFlexLocationId = (flexSpecId, stopId) => {
	return `${flexSpecId}-${stopId}-flex`
}

const generateLocationGroupId = (flexSpecId, stopId) => {
	return `${flexSpecId}-${stopId}`
}

module.exports = {
	generateFlexLocationId,
	generateLocationGroupId,
}
