module.exports = {
    root: true,
    env: {
        es6: true,
        browser: true,
        commonjs: true,
    },
    parser: `@typescript-eslint/parser`,
    parserOptions: {
        ecmaFeatures: {},
        ecmaVersion: 2020,
    },
    plugins: [
        `@typescript-eslint`,
    ],
    extends: [
        `eslint:recommended`,
        `plugin:@typescript-eslint/recommended`,
    ],
    rules: {
        "no-console": `off`,
        "no-trailing-spaces": `off`,
        "no-case-declarations": `off`,
        "quotes": [`error`, `backtick`],
        "semi": [`error`, `always`],
        "@typescript-eslint/no-var-requires": `off`,
        "@typescript-eslint/no-empty-function": `off`,
        "@typescript-eslint/no-empty-interface": `off`,
        "@typescript-eslint/ban-ts-comment": `off`,
    }
};
