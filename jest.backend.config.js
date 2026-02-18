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
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/productController.js",
    "controllers/categoryController.js",
    "helpers/authHelper.js",
    "middlewares/authMiddleware.js",
    "models/productModel.js"
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
