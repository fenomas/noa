module.exports = {
    "root": true,
    "extends": [
        "eslint:recommended",
    ],
    plugins: [],
    "env": {
        "node": true,
        "browser": true,
        "es6": true,
    },
    "parserOptions": {
        "ecmaVersion": 13,
        "sourceType": "module",
    },
    "rules": {
        "strict": ["error", "global"],

        "no-unused-vars": ["warn", { "args": "none" }],
        "no-empty": "off",
        "no-console": "off",
        "no-return-await": "error",

        "semi": ["error", "never"],
        "no-unexpected-multiline": "error",

    },
}
