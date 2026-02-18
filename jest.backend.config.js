export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
<<<<<<< auth-middleware-unit-tests
    "<rootDir>/helpers/authHelper.test.js",
    "<rootDir>/middlewares/authMiddleware.test.js"
=======
    "<rootDir>/models/*.test.js",
>>>>>>> main
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/productController.js",
<<<<<<< auth-middleware-unit-tests
    "helpers/authHelper.js",
    "middlewares/authMiddleware.js"
  ],  coverageThreshold: {
=======
    "controllers/categoryController.js",
      "models/productModel.js"
  ],
  coverageThreshold: {
>>>>>>> main
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
