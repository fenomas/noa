'use strict'

var fs = require('fs')
var path = require('path')
// var markdox = require('markdox')

var fixtures = [
	'index.js',
	'lib/entities.js',
	'lib/world.js'
]

var options = {
	output: 'README.md',
	template: 'tools/doctemplate.ejs',
	dox: {
		skipSingleStar: true
	}
}

// markdox.process(fixtures, options, function () {
	var header = fs.readFileSync(path.join(__dirname, 'readme_header.md'))
	// var body = fs.readFileSync(path.resolve(__dirname, '../README.md'))
	var body = '\n\n\n(docs currently broken by some weird npm+markdox issue..)\n\n\n'
	var joined = header + body
	fs.writeFile(path.resolve(__dirname, '../README.md'), joined, function (err) {
		if (err) return console.log(err);
	})
// })
