// import 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.umd.js';
// import 'https://pramari.de/static/cookieconsent/cookieconsent.3.0.1.umd.js';
import "/js/cookieconsent.js";

function updateConsent(cookie) {
  console.log(cookie);
}

CookieConsent.run({
  onFirstConsent: ({ cookie }) => {
    updateConsent(cookie);
  },
  onConsentChange: ({ cookie }) => {
    updateConsent(cookie);
  },
  onChange: ({ cookie }) => {
    updateConsent(cookie);
  },
  guiOptions: {
    consentModal: {
      layout: "box wide",
      position: "bottom right",
      equalWeightButtons: false,
      flipButtons: false,
    },
    preferencesModal: {
      layout: "bar wide",
      position: "right",
      equalWeightButtons: false,
      flipButtons: true,
    },
  },
  categories: {
    necessary: {
      readOnly: true,
    },
    analytics: {
      enabled: true,
    },
  },
  language: {
    default: "en",
    autoDetect: "browser",
    translations: {
      en: "https://pramari.de/static/cookieconsent/en.json",
    },
  },
  disablePageInteraction: false,
});
