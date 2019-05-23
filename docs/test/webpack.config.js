'use strict'

var path = require('path')


module.exports = {
	mode: 'development',
	entry: './index.js',
	output: {
		path: path.resolve('.'),
		filename: 'bundle.js',
	},
	devServer: {
		inline: true,
		host: "0.0.0.0",
		stats: "minimal",
	},
}
