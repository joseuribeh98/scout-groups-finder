import { ICONS, iconAttrs, type IconName } from "@/lib/icons";

interface Props {
  name: IconName;
  class?: string;
}

export default function Icon({ name, class: className = "size-5" }: Props) {
  const def = ICONS[name];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      class={`shrink-0 ${className}`}
      viewBox={def.viewBox}
      {...iconAttrs(def)}
    >
      {def.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
