import type { ComponentChildren } from "preact";

export const PANEL_WIDTH = 400;
export const PANEL_INSET = 16;

interface Props {
  label: string;
  header: ComponentChildren;
  search: ComponentChildren;
  filters: ComponentChildren;
  status: ComponentChildren;
  list: ComponentChildren;
}

/** Panel flotante de escritorio. Sin JS es una columna estática (no hay `.js`). */
export default function Panel({ label, header, search, filters, status, list }: Props) {
  return (
    <section
      data-finder-ui
      aria-label={label}
      class="hidden flex-col gap-3 bg-surface p-4 lg:flex js:absolute js:top-4 js:bottom-4 js:left-4 js:z-10 js:w-[25rem] js:overflow-hidden js:rounded-2xl js:shadow-[0_10px_30px_rgb(20_10_30/0.16)]"
    >
      {header}
      {search}
      {filters}
      {status}
      <div class="js:min-h-0 js:flex-1 js:overflow-y-auto">{list}</div>
    </section>
  );
}
