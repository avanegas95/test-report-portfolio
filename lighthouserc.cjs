/** @type {import('@lhci/cli').CiConfig} */
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:4321/"],
      numberOfRuns: 3,
      settings: {
        emulatedFormFactor: "mobile",
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./reports/lhci",
    },
  },
};
