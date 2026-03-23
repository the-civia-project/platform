import { css } from "hono/css";
import { raw } from "hono/html";
import type { FC } from "hono/jsx";
import {
  countries,
  countryFlagUrl,
  formatCountryCodesLabel,
  getCountryAlpha2,
} from "../constants/countries.ts";

const countryPickerScript = `
(() => {
  const pickers = document.querySelectorAll("[data-country-picker]");
  for (const root of pickers) {
    const hidden = root.querySelector('input[type="hidden"]');
    const search = root.querySelector("[data-country-search]");
    const selected = root.querySelector("[data-country-selected]");
    const selectedFlag = root.querySelector("[data-selected-flag]");
    const selectedName = root.querySelector("[data-selected-name]");
    const selectedIso = root.querySelector("[data-selected-iso]");
    const clearBtn = root.querySelector("[data-country-clear]");
    const list = root.querySelector("[data-country-list]");
    if (!hidden || !search || !selected || !list) continue;

    const options = [...list.querySelectorAll("[data-country-option]")];

    const showList = () => {
      list.hidden = false;
      search.setAttribute("aria-expanded", "true");
    };

    const hideList = () => {
      list.hidden = true;
      search.setAttribute("aria-expanded", "false");
    };

    const showSearch = () => {
      search.hidden = false;
      selected.hidden = true;
      search.removeAttribute("aria-hidden");
    };

    const showSelected = (option) => {
      const code = option.dataset.code ?? "";
      const name = option.dataset.name ?? "";
      const alpha2 = option.dataset.alpha2 ?? "";
      const flagSrc = option.querySelector("img")?.getAttribute("src") ?? "";

      hidden.value = code;
      search.value = "";
      search.hidden = true;
      search.setAttribute("aria-hidden", "true");
      selected.hidden = false;

      if (selectedFlag && flagSrc) {
        selectedFlag.src = flagSrc;
        selectedFlag.hidden = false;
      } else if (selectedFlag) {
        selectedFlag.hidden = true;
      }

      if (selectedName) selectedName.textContent = name;
      if (selectedIso) {
        selectedIso.textContent =
          option.dataset.codes ?? (alpha2 ? alpha2 + " · " + code : String(code));
      }

      hideList();
    };

    const clearSelected = () => {
      hidden.value = "";
      showSearch();
      search.value = "";
      search.focus();
      filterOptions();
      showList();
    };

    const optionMatches = (option, query) => {
      if (!query) return true;

      const q = query.toLowerCase();
      const name = (option.dataset.name ?? "").toLowerCase();
      const alpha2 = (option.dataset.alpha2 ?? "").toLowerCase();
      const code = String(option.dataset.code ?? "");
      const searchText = (option.dataset.search ?? "").toLowerCase();

      return (
        searchText.includes(q) ||
        name.includes(q) ||
        alpha2 === q ||
        alpha2.startsWith(q) ||
        code === q ||
        code.startsWith(q)
      );
    };

    const filterOptions = () => {
      const query = search.value.trim();
      let visible = 0;

      for (const option of options) {
        const match = optionMatches(option, query);
        option.hidden = !match;
        if (match) visible++;
      }

      if (visible === 0) {
        hideList();
      } else {
        showList();
      }
    };

    search.addEventListener("focus", () => {
      if (search.hidden) return;
      filterOptions();
      showList();
    });

    search.addEventListener("input", filterOptions);

    clearBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      clearSelected();
    });

    for (const option of options) {
      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
        showSelected(option);
      });
    }

    root.closest("form")?.addEventListener("submit", (event) => {
      if (!hidden.value) {
        event.preventDefault();
        if (search.hidden) {
          clearSelected();
        } else {
          search.focus();
          showList();
        }
      }
    });
  }
})();
`.trim();

const pickerClass = css`
  /* country-picker */
  position: relative;
`;

const fieldClass = css`
  /* country-picker-field */
  position: relative;
`;

const fieldShellClass = css`
  /* country-picker-shell */
  width: 100%;
  min-height: 4rem;
  padding: 12px 14px;
  box-sizing: border-box;
  border: 1px solid var(--border, #222);
  border-radius: var(--radius, 12px);
  background-color: rgba(0, 0, 0, 0.35);
`;

const searchClass = css`
  /* country-search */
  ${fieldShellClass}
  font-size: 16px;
  line-height: 1.25;

  &[hidden] {
    display: none;
  }
`;

const selectedClass = css`
  /* country-picker-selected */
  ${fieldShellClass}
  display: flex;
  align-items: center;
  gap: 12px;

  &[hidden] {
    display: none;
  }
`;

const selectedTextClass = css`
  /* country-picker-selected-text */
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;

  & [data-selected-name] {
    font-size: 16px;
    line-height: 1.25;
  }
`;

const isoClass = css`
  /* country-picker-iso */
  font-size: 14px;
  opacity: 0.65;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
`;

const clearClass = css`
  /* country-picker-clear */
  flex-shrink: 0;
  margin: 0;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted, rgba(255, 255, 255, 0.55));
  background: transparent;
  border: 1px solid var(--border, #222);
  border-radius: var(--radius, 12px);
  box-shadow: none;
  cursor: pointer;

  &:hover {
    color: var(--text, #fff);
    background: rgba(0, 51, 153, 0.2);
    border-color: rgba(255, 204, 0, 0.25);
    filter: none;
    box-shadow: none;
  }
`;

const listClass = css`
  /* country-picker-list */
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 280px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  background-color: rgba(0, 0, 0, 0.45);
  color: var(--text, #fff);
  border: 1px solid var(--border, #222);
  border-radius: var(--radius, 12px);

  &[hidden] {
    display: none;
  }
`;

const optionClass = css`
  /* country-picker-option */
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;

  &[hidden] {
    display: none;
  }

  &:hover {
    background-color: rgba(0, 51, 153, 0.25);
  }
`;

const flagClass = css`
  /* country-picker-flag */
  flex-shrink: 0;
  width: 24px;
  height: 18px;
  border-radius: 2px;
  object-fit: cover;
`;

const nameClass = css`
  /* country-picker-name */
  flex: 1;
  min-width: 0;
  font-size: 16px;
`;

const codeClass = css`
  /* country-picker-code */
  flex-shrink: 0;
  font-size: 14px;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
`;

export const CountryPicker: FC = () => {
  return (
    <>
      <div class={pickerClass} data-country-picker>
        <input type="hidden" name="country" value="" />
        <div class={fieldClass}>
          <input
            type="text"
            class={searchClass}
            data-country-search
            placeholder="Search by name or ISO (DE, DEU, 276)…"
            autocomplete="off"
            role="combobox"
            aria-expanded="false"
            aria-controls="country-picker-list"
            aria-autocomplete="list"
          />
          <div class={selectedClass} data-country-selected hidden>
            <img
              class={flagClass}
              data-selected-flag
              alt=""
              width={24}
              height={18}
            />
            <div class={selectedTextClass}>
              <span data-selected-name />
              <span class={isoClass} data-selected-iso />
            </div>
            <button type="button" class={clearClass} data-country-clear>
              Change
            </button>
          </div>
        </div>
        <ul
          id="country-picker-list"
          class={listClass}
          data-country-list
          role="listbox"
          hidden
        >
          {countries.map((country) => {
            const alpha2 = getCountryAlpha2(country.code) ?? "";
            const codesLabel = formatCountryCodesLabel(country.code);
            const searchText = `${country.name} ${codesLabel}`;
            const flagUrl = countryFlagUrl(country.code);

            return (
              <li
                class={optionClass}
                role="option"
                data-country-option
                data-code={country.code}
                data-name={country.name}
                data-alpha2={alpha2}
                data-codes={codesLabel}
                data-search={searchText}
              >
                {flagUrl && (
                  <img
                    class={flagClass}
                    src={flagUrl}
                    alt=""
                    width={24}
                    height={18}
                  />
                )}
                <span class={nameClass}>{country.name}</span>
                <span class={codeClass}>{codesLabel}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <script>{raw(countryPickerScript)}</script>
    </>
  );
};
