/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^expo-linking$': '<rootDir>/tests/mocks/expo-linking.js',
    '^expo-sqlite$': '<rootDir>/tests/mocks/expo-sqlite.js',
    '^expo-notifications$': '<rootDir>/tests/mocks/expo-notifications.js',
    '^expo-secure-store$': '<rootDir>/tests/mocks/expo-secure-store.js',
    '^react-native$': '<rootDir>/tests/mocks/react-native.js',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          jsx: 'react-jsx',
        },
      },
    ],
  },
};
