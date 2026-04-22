import Link from "next/link";

import { CardThumbImage } from "./card-thumb";

export type CareerCardTag = "featured" | "new";

/** Neo-brutalist chip (black border + 2px hard shadow) — use on overlays / badges too */
export function careerCardTagClassName(tag: CareerCardTag): string {
  return tag === "featured"
    ? "border-2 border-[var(--cg-3d-border)] bg-[#fce4ec] text-pink-950 shadow-[2px_2px_0_0_var(--cg-3d-border)]"
    : "border-2 border-[var(--cg-3d-border)] bg-teal-50 text-teal-950 shadow-[2px_2px_0_0_var(--cg-3d-border)]";
}

type CareerCardProps = {
  title: string;
  subtitle?: string;
  meta: string;
  tag?: CareerCardTag;
  href?: string;
  /** Visual preset for thumbnail area */
  thumb: "sunset" | "ocean" | "lavender" | "mint" | "coral" | "slate";
  className?: string;
  compact?: boolean;
};

export function CareerCard({
  title,
  subtitle,
  meta,
  tag,
  href,
  thumb,
  className = "",
  compact
}: CareerCardProps) {
  const inner = (
    <>
      <CardThumbImage variant={thumb} alt={title} compact={compact}>
        {tag ? (
          <span
            className={`absolute left-2 top-2 z-[1] rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${careerCardTagClassName(tag)}`}
          >
            {tag === "featured" ? "Featured" : "New"}
          </span>
        ) : null}
      </CardThumbImage>
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-cg-text">{title}</h3>
      {subtitle ? <p className="mt-0.5 line-clamp-1 text-xs text-cg-muted">{subtitle}</p> : null}
      <p className="mt-2 text-xs font-medium text-cg-muted">{meta}</p>
    </>
  );

  const cardClass = `group block w-[min(100%,11.5rem)] shrink-0 rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-3 shadow-[var(--cg-3d-shadow)] transition-all duration-200 ease-out hover:-translate-x-px hover:-translate-y-px hover:shadow-[var(--cg-3d-shadow-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--cg-3d-border)] ${className}`;

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}

export function CareerCardWide({
  title,
  subtitle,
  meta,
  tag,
  href,
  thumb,
  tall,
  internshipHref,
  internshipLabel = "Virtual internship"
}: Omit<CareerCardProps, "compact"> & {
  tall?: boolean;
  /** Second link — avoids nesting &lt;a&gt; inside the primary card link */
  internshipHref?: string;
  internshipLabel?: string;
}) {
  const inner = (
    <>
      <CardThumbImage variant={thumb} alt={title} tall={tall} wide>
        {tag ? (
          <span
            className={`absolute left-3 top-3 z-[1] rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${careerCardTagClassName(tag)}`}
          >
            {tag === "featured" ? "Featured" : "New"}
          </span>
        ) : null}
      </CardThumbImage>
      <h3 className="text-base font-semibold text-cg-text">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-cg-muted">{subtitle}</p> : null}
      <p className="mt-3 text-sm font-medium text-cg-muted">{meta}</p>
    </>
  );

  const cardClass = `group flex min-w-0 flex-col rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-4 shadow-[var(--cg-3d-shadow)] transition-all duration-200 ease-out hover:-translate-x-px hover:-translate-y-px hover:shadow-[var(--cg-3d-shadow-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--cg-3d-border)]`;

  const internshipBtn =
    internshipHref ? (
      <Link
        href={internshipHref}
        className="mt-3 w-full rounded-xl border-2 border-[var(--cg-3d-border)] bg-amber-50 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-amber-950 shadow-[2px_2px_0_0_var(--cg-3d-border)] transition hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/50"
        onClick={(e) => e.stopPropagation()}
      >
        {internshipLabel} →
      </Link>
    ) : null;

  if (href && internshipHref) {
    return (
      <div className={cardClass}>
        <Link href={href} className="flex min-w-0 flex-col outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-emerald-700">
          {inner}
        </Link>
        {internshipBtn}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}
