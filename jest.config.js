const {pathsToModuleNameMapper} = require(`ts-jest/utils`);
const {compilerOptions} = require(`./tsconfig.json`);


module.exports = {
    testEnvironment: `jsdom`,
    rootDir: `.`,
    roots: [`./src`],
    transform: {
        "^.+\\.(j|t)sx?$": `babel-jest`,
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          `<rootDir>/test-settings/__mocks__/fileMock.js`,
    },
    moduleNameMapper: {
        "\\.(css|less)$": `<rootDir>/test-settings/__mocks__/styleMock.js`,
        ...pathsToModuleNameMapper(compilerOptions.paths, {prefix: `<rootDir>/`}),
    },
    setupFilesAfterEnv: [`<rootDir>/test-settings/test-setup.js`]
};