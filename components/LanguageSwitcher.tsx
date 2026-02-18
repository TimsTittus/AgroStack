"use client";

import { useState, useEffect } from "react";

export default function LanguageSwitcher() {
  const [activeLang, setActiveLang] = useState<string>("en");

  useEffect(() => {
    const select = document.querySelector(
      ".goog-te-combo"
    ) as HTMLSelectElement;

    if (select) {
      setActiveLang(select.value || "en");
    }
  }, []);

  const changeLanguage = (lang: string) => {
    const select = document.querySelector(
      ".goog-te-combo"
    ) as HTMLSelectElement;

    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
      setActiveLang(lang);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage("en")}
        className={`px-3 py-1 rounded-md border ${
          activeLang === "en" ? "bg-green-600 text-white" : ""
        }`}
      >
        English
      </button>

      <button
        onClick={() => changeLanguage("ml")}
        className={`px-3 py-1 rounded-md border ${
          activeLang === "ml" ? "bg-green-600 text-white" : ""
        }`}
      >
        മലയാളം
      </button>
    </div>
  );
}
