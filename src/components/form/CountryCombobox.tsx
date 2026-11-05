import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { STROKED_ICONS } from '@/lib/icons';
import {
  COUNTRIES,
  SUGGESTED_CODES,
  countryByCode,
  findCountry,
  guessCountry,
  searchCountries,
  type Country,
} from '@/lib/countries';
import { cn } from '@/lib/utils';

/**
 * CountryCombobox — a searchable country picker: type to filter ~250
 * countries, or open the list and pick one. Used by the join form, where the
 * Google Form's Country question used to be free text and came back as
 * "usa", "U.S.", "United States" and "america" in the same Sheet column.
 *
 * - **One answer per country.** The value posted (`name`, via a hidden input)
 *   is always the canonical English name from `src/lib/countries.ts`. Typed
 *   text that isn't a country (or an alias like "UK" or "Holland") fails the
 *   browser's own validation, so the form won't submit with it.
 * - **Pre-filled from the browser's language** (`navigator.languages`, e.g.
 *   "en-GB" -> United Kingdom) after hydration. It's a guess from a language
 *   setting, not location, so it's only a starting value the visitor can
 *   change. There's deliberately no "we guessed this" note (the team found it
 *   unnecessary). Server HTML renders the field empty, so nothing differs
 *   between server and client markup.
 * - **Suggested first.** With an empty search the list opens with the US,
 *   Canada and the European countries the team draws from, then A–Z.
 *
 * Accessibility: the ARIA 1.2 combobox pattern (input `role="combobox"`,
 * `aria-activedescendant` into a `listbox`). Arrow keys move, Enter picks,
 * Escape closes, Alt+Down opens. Options are 44px tall. The label is the
 * caller's `<label htmlFor={id}>`, so it stays a visible label like every
 * other field.
 */

interface CountryComboboxProps {
  /** The visible input's id: point the field's `<label htmlFor>` at it. */
  id: string;
  /** Form field name for the posted country name. */
  name: string;
  required?: boolean;
  /** ISO code to start on. Skips the browser-language guess. */
  defaultCode?: string;
  /** Guess the country from the browser's language. Default on. */
  detect?: boolean;
  /** Language list to guess from. Defaults to `navigator.languages`; for tests. */
  languages?: readonly string[];
}

const INVALID = 'Choose a country from the list.';

function Glyph({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

export default function CountryCombobox({
  id,
  name,
  required,
  defaultCode,
  detect = true,
  languages,
}: CountryComboboxProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const hintId = `${uid}-hint`;
  const initial = countryByCode(defaultCode);

  const [selected, setSelected] = useState<Country | undefined>(initial);
  const [query, setQuery] = useState(initial?.name ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Pre-fill from the browser language once, after hydration.
  useEffect(() => {
    if (!detect || defaultCode) return;
    const langs =
      languages ??
      (typeof navigator !== 'undefined'
        ? navigator.languages?.length
          ? navigator.languages
          : [navigator.language]
        : []);
    const guess = guessCountry(langs);
    if (guess) {
      setSelected((current) => current ?? guess);
      setQuery((current) => current || guess.name);
    }
    // Run once: a later change of `languages` shouldn't overwrite a choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While the box shows the chosen country (or nothing), list everything,
  // suggestions first. Once the visitor types, list matches only.
  const searching = query.trim() !== '' && query !== selected?.name;
  const groups = useMemo(() => {
    if (searching) return [{ label: '', items: searchCountries(query) }];
    const suggested = SUGGESTED_CODES.map((code) => countryByCode(code)).filter(
      (c): c is Country => Boolean(c)
    );
    return [
      { label: 'Suggested', items: suggested },
      { label: 'All countries', items: COUNTRIES },
    ];
  }, [query, searching]);
  // Flat option list for keyboard movement. The same country can sit in both
  // groups, so options are keyed by group too.
  const flat = groups.flatMap((g, gi) => g.items.map((c) => ({ country: c, key: `${gi}-${c.code}` })));

  const invalid = query.trim() !== '' && selected?.name !== query;

  useEffect(() => {
    inputRef.current?.setCustomValidity(invalid ? INVALID : '');
  }, [invalid]);

  // Keep the highlighted option visible as the arrow keys move it.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function openList() {
    if (open) return;
    // Start on the chosen country if it's listed, else the top.
    const at = selected ? flat.findIndex((o) => o.country.code === selected.code) : -1;
    setActive(at >= 0 ? at : 0);
    setOpen(true);
  }

  function choose(country: Country) {
    setSelected(country);
    setQuery(country.name);
    setOpen(false);
  }

  function commitTyped() {
    // "uk", "usa", "Curacao": accept anything that names exactly one country.
    const match = findCountry(query);
    if (match) {
      choose(match);
    } else if (query.trim() === '') {
      setSelected(undefined);
      setQuery('');
    }
    setOpen(false);
    setTouched(true);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(flat.length - 1, i + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) setActive((i) => Math.max(0, i - 1));
        break;
      case 'PageDown':
        if (open) {
          event.preventDefault();
          setActive((i) => Math.min(flat.length - 1, i + 8));
        }
        break;
      case 'PageUp':
        if (open) {
          event.preventDefault();
          setActive((i) => Math.max(0, i - 8));
        }
        break;
      case 'Enter':
        // Pick the highlighted option; never submit the form from an open list.
        if (open) {
          event.preventDefault();
          const option = flat[active];
          if (option) choose(option.country);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        if (open && searching && flat[active]) choose(flat[active].country);
        break;
    }
  }

  const activeOption = open ? flat[active] : undefined;
  let index = -1;

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected?.name === query ? selected.name : ''} />
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          className={cn('field-input pr-11')}
          autoComplete="off"
          spellCheck={false}
          placeholder="Start typing a country…"
          required={required}
          value={query}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? `${uid}-${activeOption.key}` : undefined}
          aria-invalid={touched && invalid ? true : undefined}
          aria-describedby={hintId}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onClick={openList}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={commitTyped}
          onKeyDown={(event) => {
            if (event.altKey && event.key === 'ArrowDown') {
              event.preventDefault();
              openList();
              return;
            }
            onKeyDown(event);
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Close country list' : 'Show all countries'}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gold-300 hover:text-bone"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) setOpen(false);
            else {
              inputRef.current?.focus();
              openList();
            }
          }}
        >
          <Glyph d={STROKED_ICONS.chevron} className={cn('size-5 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Countries"
        hidden={!open}
        className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-sm border border-gold bg-ink-800 py-1 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
      >
        {flat.length === 0 && (
          <li role="presentation" className="px-3 py-3 text-sm text-bone-muted">
            No country matches &ldquo;{query}&rdquo;.
          </li>
        )}
        {groups.map((group, gi) => {
          const options = group.items.map((country) => {
            index += 1;
            const at = index;
            const key = `${gi}-${country.code}`;
            const isActive = at === active;
            const isSelected = selected?.code === country.code;
            return (
              <li
                key={key}
                id={`${uid}-${key}`}
                role="option"
                aria-selected={isSelected}
                data-active={isActive}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-sm',
                  isActive ? 'bg-ink-700 text-bone' : 'text-bone-muted',
                  isSelected && 'font-bold text-bone'
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActive(at)}
                onClick={() => choose(country)}
              >
                {country.name}
                {isSelected && <Glyph d={STROKED_ICONS.check} className="size-4 shrink-0 text-gold" />}
              </li>
            );
          });
          if (!group.label) return options;
          return (
            <li key={group.label} role="presentation">
              <p
                id={`${uid}-g${gi}`}
                className="px-3 pb-1 pt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-300"
              >
                {group.label}
              </p>
              <ul role="group" aria-labelledby={`${uid}-g${gi}`}>
                {options}
              </ul>
            </li>
          );
        })}
      </ul>

      <p id={hintId} className="field-hint" data-error={touched && invalid ? 'true' : undefined}>
        {touched && invalid
          ? INVALID
          : 'Type to search, or pick from the list.'}
      </p>
    </div>
  );
}
