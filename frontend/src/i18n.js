import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./i18n/en.json";
import te from "./i18n/te.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      te: { translation: te }
    },

    lng: localStorage.getItem("lang") || "en",

    fallbackLng: "en",

    interpolation: {
      escapeValue: false
    }

  });

export default i18n;