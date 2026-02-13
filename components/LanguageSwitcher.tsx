"use client";

export default function LanguageSwitcher() {

  const changeLanguage = (lang: string) => {
    const select = document.querySelector(
      ".goog-te-combo"
    ) as HTMLSelectElement;

    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage("en")}
        className="px-3 py-1 rounded-md border"
      >
        English
      </button>

      <button
        onClick={() => changeLanguage("ml")}
        className="px-3 py-1 rounded-md bg-green-600 text-white"
      >
        മലയാളം
      </button>
    </div>
  );
}
