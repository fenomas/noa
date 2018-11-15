
var path = require('path')


module.exports = {
    entry: './index.js',
	mode: 'production',
    output: {
        path: path.resolve('.'),
        filename: 'bundle.js',
    },
    devServer: {
        open: true,
        inline: true,
        host: "127.0.0.1",
        stats: "minimal",
    },
}




