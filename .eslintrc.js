module.exports = {
    "extends": "eslint:recommended",
    "env": {
        "browser": true,
        "es6": true,
        "commonjs": true,
    },
    "globals": {
        "BABYLON": "readonly",
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
