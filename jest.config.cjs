/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Aliases de camada (espelham o campo "imports" do package.json, que
    // aponta para dist/ em runtime; nos testes resolvemos direto para src/).
    '^#domain/(.*)\\.js$': '<rootDir>/src/domain/$1',
    '^#application/(.*)\\.js$': '<rootDir>/src/application/$1',
    '^#infrastructure/(.*)\\.js$': '<rootDir>/src/infrastructure/$1',
    '^#presentation/(.*)\\.js$': '<rootDir>/src/presentation/$1',
    '^#shared/(.*)\\.js$': '<rootDir>/src/shared/$1',
    '^#prisma-service/(.*)\\.js$': '<rootDir>/src/prisma/$1',
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
  collectCoverageFrom: ['src/**/*.ts', '!src/generated/**'],
  coverageDirectory: './coverage',
};
