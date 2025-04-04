// spec/helpers/jasmine-helper.js
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;

// Remove default jasmine reporter
jasmine.getEnv().clearReporters();

// Add jasmine-spec-reporter
jasmine.getEnv().addReporter(
  new SpecReporter({
    spec: {
      displayPending: true,
      displayDuration: true
    },
    summary: {
      displayDuration: false
    }
  })
);