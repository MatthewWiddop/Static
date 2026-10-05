import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',

  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  testEnvironment: 'node',
};

export default config;

