import { useEffect, useId, useRef, useState } from 'react';
import { STROKED_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';

/**
 * ChecklistDropdown — pick several answers from a short list, in the space of
 * one field. Made for the join form, whose format and position questions are
 * checkbox questions on the Google Form.
 *
 * Real checkboxes share `name`, so the form reads answers with
 * `FormData.getAll(name)`, which is what a Google Form's repeated entry.NNN
 * needs. Closed panels stay in the DOM so ticked boxes still submit.
 *
 * Mobile first: on phones the list opens inline and pushes the page down,
 * because a floating panel can end up clipped or behind the keyboard. From
 * `sm` up it floats like any dropdown. Rows are 44px, and phones get a Done
 * button because there's rarely anywhere obvious to tap away to.
 *
 * Required: checkboxes have no "at least one" rule, and a browser can't focus
 * one inside a closed panel, which blocks submit with no message. So an
 * unnamed, invisible input carries the validity, and a failed submit shows the
 * message inline rather than relying on a browser bubble.
 *
 * Keyboard: Enter or Space on the field opens it, Tab reaches the boxes, Space
 * ticks, Escape closes and returns focus. The form needs JS, so there's no
 * no-JS fallback for the closed list.
 */

interface ChecklistDropdownProps {
  id: string;
  name: string;
  label: string;
  options: string[];
  /** Controlled value. Omit and use `defaultValue` to leave it uncontrolled. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  requiredMessage?: string;
}

export default function ChecklistDropdown({
  id,
  name,
  label,
  options,
  value,
  defaultValue = [],
  onChange,
  placeholder = 'Choose one or more…',
  hint,
  required = false,
  requiredMessage = 'Pick at least one.',
}: ChecklistDropdownProps) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const valueId = `${uid}-value`;
  const panelId = `${uid}-panel`;
  const hintId = `${uid}-hint`;
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const proxy = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(defaultValue);
  const [failed, setFailed] = useState(false);
  const selected = value ?? inner;
  const invalid = required && selected.length === 0;
  const showError = failed && invalid;

  useEffect(() => {
    proxy.current?.setCustomValidity(invalid ? requiredMessage : '');
  }, [invalid, requiredMessage]);

  useEffect(() => {
    if (!open) return;
    // Inline on phones, so the opened list can start below the fold.
    panel.current?.scrollIntoView({ block: 'nearest' });
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  const toggle = (option: string, checked: boolean) => {
    // Kept in option order, so answers read the same however they were ticked.
    const next = options.filter((o) => (o === option ? checked : selected.includes(o)));
    setInner(next);
    onChange?.(next);
  };

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div
      ref={root}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          close();
        }
      }}
      onBlur={(event) => {
        // A null target is a tap on nothing focusable, which closeOutside covers.
        const next = event.relatedTarget as Node | null;
        if (next && !root.current?.contains(next)) setOpen(false);
      }}
    >
      <label id={labelId} className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <button
          ref={trigger}
          id={id}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-labelledby={`${labelId} ${valueId}`}
          aria-describedby={hint || showError ? hintId : undefined}
          aria-invalid={showError || undefined}
          className="field-input flex items-center justify-between gap-2 text-left"
        >
          <span id={valueId} className={cn('min-w-0', selected.length === 0 && 'text-bone-muted')}>
            {selected.length > 0 ? selected.join(', ') : placeholder}
          </span>
          <svg
            viewBox="0 0 24 24"
            className={cn('size-5 shrink-0 text-gold-300 transition-transform', open && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={STROKED_ICONS.chevron} />
          </svg>
        </button>

        {required && (
          <input
            ref={proxy}
            type="text"
            value={selected.join(', ')}
            onChange={() => {}}
            onInvalid={(event) => {
              event.preventDefault();
              setFailed(true);
            }}
            onFocus={() => trigger.current?.focus()}
            tabIndex={-1}
            aria-hidden="true"
            data-checklist-proxy={name}
            className="pointer-events-none absolute inset-x-0 top-0 h-11 opacity-0"
          />
        )}

        <div
          ref={panel}
          id={panelId}
          role="group"
          aria-labelledby={labelId}
          hidden={!open}
          className="z-30 mt-1 overflow-y-auto overscroll-contain rounded-sm border border-gold bg-ink-800 p-1 sm:absolute sm:inset-x-0 sm:top-full sm:max-h-80"
        >
          {options.map((option) => (
            <label
              key={option}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 text-sm text-bone-muted hover:bg-ink-700 [&:has(:checked)]:text-bone"
            >
              <span className="relative flex size-[18px] shrink-0">
                <input
                  type="checkbox"
                  name={name}
                  value={option}
                  checked={selected.includes(option)}
                  onChange={(event) => toggle(option, event.target.checked)}
                  className="peer absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[2px] border-2 border-ink-600 peer-checked:border-gold peer-checked:bg-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-gold"
                />
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute inset-0 m-auto size-3 text-ink opacity-0 peer-checked:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={STROKED_ICONS.check} />
                </svg>
              </span>
              {option}
            </label>
          ))}
          <button
            type="button"
            onClick={close}
            className="tap mt-1 w-full border-t border-ink-600 text-xs font-bold uppercase tracking-[0.14em] text-gold-300 sm:hidden"
          >
            Done
          </button>
        </div>
      </div>
      {(hint || showError) && (
        <p id={hintId} className="field-hint" data-error={showError ? 'true' : undefined}>
          {showError ? requiredMessage : hint}
        </p>
      )}
    </div>
  );
}
