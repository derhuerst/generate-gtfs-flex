'use strict'

const {basename, extname} = require('path')
const readCsv = require('gtfs-utils/read-csv')

const createReadGtfsFile = (requiredFiles, gtfsFilePaths) => {
	const gtfsFiles = Object.create(null)
	for (const path of gtfsFilePaths) {
		const name = basename(path, extname(path))
		gtfsFiles[name] = path
	}

	const missingFileErr = (name) => {
		const err = new Error(`missing ${name}.txt file`)
		err.code = 'ENOENT'
		err.notFound = true
		err.statusCode === 404
		return err
	}

	for (const name of requiredFiles) {
		if (!gtfsFiles[name]) throw missingFileErr(name)
	}

	const readGtfsFile = async (name) => {
		if (!gtfsFiles[name]) throw missingFileErr(name)
		return await readCsv(gtfsFiles[name])
	}
	return readGtfsFile
}

module.exports = createReadGtfsFile
