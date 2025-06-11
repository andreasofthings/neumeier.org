// import 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.umd.js';
// import 'https://pramari.de/static/cookieconsent/cookieconsent.3.0.1.umd.js';
import "/cc/cookieconsent.umd.js";

function updateConsent(cookie) {
  /* none */
}

document.documentElement.classList.add("cc--darkmode");

CookieConsent.run({
  onFirstConsent: ({ cookie }) => {},
  onConsentChange: ({ cookie }) => {},
  onChange: ({ cookie }) => {},
  guiOptions: {
    consentModal: {
      layout: "box",
      position: "bottom right",
      equalWeightButtons: false,
      flipButtons: false,
    },
    preferencesModal: {
      layout: "bar",
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
      en: "/cc/en.json",
    },
  },
  disablePageInteraction: false,
});
