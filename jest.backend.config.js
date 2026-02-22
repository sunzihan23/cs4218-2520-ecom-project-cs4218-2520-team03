export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/authHelper.test.js",
    "<rootDir>/middlewares/authMiddleware.test.js",
    "<rootDir>/models/*.test.js",
    "<rootDir>/config/db.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/productController.js",
    "controllers/categoryController.js",
    "controllers/authController.js",
    "helpers/authHelper.js",
    "middlewares/authMiddleware.js",
    "models/*.js",
    "config/db.js"
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
