
var markdox = require('markdox')

markdox.process(
	[
		'index.js',
		'lib/entities.js',
		'lib/world.js'
	],
	{
		output: 'README.md',
		template: 'tools/doctemplate.ejs',
		dox: {
			skipSingleStar: true
		}
	})
