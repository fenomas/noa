
var fs = require('fs')
var markdox = require('markdox')

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

markdox.process(fixtures, options, function () {
	header = fs.readFileSync(__dirname + '/tools/readme_header.md')
	body = fs.readFileSync(__dirname + '/README.md')
	var joined = header + body
	fs.writeFile(__dirname + '/README.md', joined, function (err) {
		if (err) return console.log(err);
	})
})
