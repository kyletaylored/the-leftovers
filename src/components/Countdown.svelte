<script lang="ts">
  /**
   * Countdown — the only always-running island on the site (§4).
   *
   * Server-rendered with the correct values so it is never blank and never
   * shifts layout (CLS budget, §10.2); the client script only takes over
   * ticking. Digits are tabular so the box can't resize as numbers change.
   */
  interface Props {
    /** ISO string — passed from Astro so SSR and client agree on the target. */
    target: string;
    /** Rendered once the target has passed. */
    passedLabel?: string;
  }

  let { target, passedLabel = "It's game day" }: Props = $props();

  const targetMs = new Date(target).getTime();

  const split = (remaining: number) => ({
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1000),
  });

  let remaining = $state(Math.max(0, targetMs - Date.now()));

  $effect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      remaining = Math.max(0, targetMs - Date.now());
    }, 1000);
    return () => clearInterval(id);
  });

  const parts = $derived(split(remaining));
  const pad = (n: number) => String(n).padStart(2, '0');
</script>

{#if remaining <= 0}
  <p class="passed">{passedLabel}</p>
{:else}
  <!-- aria-live is deliberately off: a ticking clock announced every second
       is hostile to a screen reader. The full date is in the sibling
       <time> element, which is the accessible source of truth. -->
  <div class="countdown" role="group" aria-label="Time until the next event">
    {#each [{ label: 'Days', value: parts.days }, { label: 'Hrs', value: parts.hours }, { label: 'Min', value: parts.minutes }, { label: 'Sec', value: parts.seconds }] as part (part.label)}
      <div class="unit">
        <span class="numeral value">{pad(part.value)}</span>
        <span class="label">{part.label}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .countdown {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.25rem;
    max-width: 22rem;
  }
  .unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-left: 1px solid color-mix(in srgb, var(--color-gold) 30%, transparent);
  }
  .unit:first-child {
    border-left: 0;
    padding-left: 0;
  }
  .value {
    font-size: clamp(1.75rem, 7vw, 2.5rem);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .label {
    margin-top: 0.35rem;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-bone-muted);
  }
  .passed {
    font-family: var(--font-display);
    font-size: 1.75rem;
    text-transform: uppercase;
    color: var(--color-gold-300);
  }
</style>
