module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        strict: false,
        skipLibCheck: true,
        baseUrl: '<rootDir>/src'
      }
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/config/test-setup.ts'],
  // Load env vars BEFORE any module is imported (critical for config/index.ts)
  setupFiles: ['<rootDir>/src/config/test-env-setup.js'],
  // Force sequential execution to avoid database connection pool exhaustion
  maxWorkers: 1,
  // Increase test timeout for slower CI environments
  testTimeout: 60000,
  // Clear all mocks and global state between tests
  clearMocks: true,
};
