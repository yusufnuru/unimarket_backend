import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  verbose: true,
  roots: ['<rootDir>/src', '<rootDir>/__test__'],
  moduleNameMapper: {
    '^@admin/(.*)$': '<rootDir>/src/admin/$1',
    '^@auth/(.*)$': '<rootDir>/src/auth/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@constants': '<rootDir>/src/constants/index.ts', // Bare import
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@messaging/(.*)$': '<rootDir>/src/messaging/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@schema$': '<rootDir>/src/schema/index.ts', // Bare import
    '^@schema/(.*)$': '<rootDir>/src/schema/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@user/(.*)$': '<rootDir>/src/user/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  // extensionsToTreatAsEsm: ['.ts'], // Treat .ts files as ES modules
  // transform: {
  //   '^.+\\.ts$': ['ts-jest', {
  //     useESM: true,
  //     // Enable ESM support
  //   }],
  // },
};

export default config;
