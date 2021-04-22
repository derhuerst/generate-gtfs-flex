'use strict'

const {basename, extname} = require('path')
const readCsv = require('gtfs-utils/read-csv')

const createReadGtfsFile = (requiredFiles, gtfsFilePaths) => {
	const gtfsFiles = Object.create(null)
	for (const path of gtfsFilePaths) {
		const name = basename(path, extname(path))
		gtfsFiles[name] = path
	}

	const missingFileErr = name => new Error(`missing ${name}.txt file`)
	for (const name of requiredFiles) {
		if (!gtfsFiles[name]) throw missingFileErr(name)
	}

	const readGtfsFile = (name) => {
		if (!gtfsFiles[name]) throw missingFileErr(name)
		return readCsv(gtfsFiles[name])
	}
	return readGtfsFile
}

module.exports = createReadGtfsFile
