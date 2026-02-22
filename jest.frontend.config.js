export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  testMatch: [
    // "<rootDir>/client/src/components/*.test.js",
    // "<rootDir>/client/src/pages/*.test.js",
    // "<rootDir>/client/src/pages/admin/*.test.js",
    // "<rootDir>/client/src/pages/Auth/*.test.js",
    // "<rootDir>/client/src/pages/user/*.test.js",
    // "<rootDir>/client/src/context/*.test.js",
    // "<rootDir>/client/src/hooks/useCategory.test.js",
    // "<rootDir>/client/src/components/Routes/Private.test.js",
    // "<rootDir>/client/src/components/Form/*.test.js",
    "<rootDir>/client/src/pages/HomePage.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    // "client/src/components/*.js",
    // "<rootDir>/client/src/pages/*.js",
    // "<rootDir>/client/src/pages/admin/*.js",
    // "<rootDir>/client/src/pages/Auth/*.js",
    // "<rootDir>/client/src/pages/user/*.js",
    // "<rootDir>/client/src/context/*.js",
    // "<rootDir>/client/src/hooks/useCategory.js",
    // "<rootDir>/client/src/components/Routes/Private.js",
    // "<rootDir>/client/src/components/Form/*.js",
    "<rootDir>/client/src/pages/HomePage.js",
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
