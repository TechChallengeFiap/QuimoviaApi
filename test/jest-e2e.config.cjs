/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testRegex: '.*\\.e2e-spec\\.ts$',
  testTimeout: 15000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Aliases de src/shared e src/generated (espelham o campo "imports" do
    // package.json, que aponta para dist/ em runtime; nos testes
    // resolvemos direto para src/).
    '^#shared/(.*)\\.js$': '<rootDir>/src/shared/$1',
    '^#generated/(.*)\\.js$': '<rootDir>/src/generated/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: { module: 'ESNext', moduleResolution: 'bundler' },
      },
    ],
  },
};
