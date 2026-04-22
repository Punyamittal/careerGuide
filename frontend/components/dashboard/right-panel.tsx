import Image from "next/image";
import Link from "next/link";

import { careerCardTagClassName } from "./career-card";
import { dicebearLoreleiAvatar, LATEST_LEARNED_HERO, PROGRESS_THUMB } from "./card-art";

export type ProgressItem = {
  title: string;
  subtitle: string;
  part: string;
  progress: number;
  thumb: "sunset" | "ocean" | "lavender" | "mint";
};

type RightPanelProps = {
  userName: string;
  latestTitle?: string;
  latestMeta?: string;
  latestHref?: string;
  progressItems: ProgressItem[];
};

function ProgressRow({ item }: { item: ProgressItem }) {
  const thumbSrc = PROGRESS_THUMB[item.thumb];
  return (
    <div className="flex gap-3 rounded-2xl border-2 border-[var(--cg-3d-border)] bg-zinc-50/90 p-3 shadow-[3px_3px_0_0_var(--cg-3d-border)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--cg-3d-border)]">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-[var(--cg-3d-border)] shadow-[2px_2px_0_0_var(--cg-3d-border)]">
        <Image src={thumbSrc} alt={item.title} fill className="object-cover" sizes="56px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-cg-text">{item.title}</p>
        <p className="mt-0.5 text-xs text-cg-muted">{item.subtitle}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-cg-muted">{item.part}</span>
          <div className="h-1.5 w-24 max-w-[45%] overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-[#5b9fd4] transition-all duration-500 ease-out"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RightPanel({ userName, latestTitle, latestMeta, latestHref, progressItems }: RightPanelProps) {
  return (
    <div className="flex w-full flex-col gap-6 bg-[#faf7f2] px-5 py-6">
      <div className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-4 shadow-[var(--cg-3d-shadow)]">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[var(--cg-3d-border)] bg-cg-accent-soft shadow-[2px_2px_0_0_var(--cg-3d-border)]">
            <Image
              src={dicebearLoreleiAvatar(userName)}
              alt={`Avatar for ${userName}`}
              width={48}
              height={48}
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-cg-text">{userName}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-cg-muted">
              You&apos;re doing great — keep practicing and refining your profile.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm font-bold text-cg-text">Latest learned</h3>
        {latestTitle && latestHref ? (
          <Link
            href={latestHref}
            className="group block overflow-hidden rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card shadow-[var(--cg-3d-shadow)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[var(--cg-3d-shadow-hover)]"
          >
            <div className="relative h-32 border-b-2 border-[var(--cg-3d-border)] bg-zinc-200">
              <Image
                src={LATEST_LEARNED_HERO}
                alt="Green rolling hills and distant mountains — pastoral landscape"
                fill
                className="object-cover"
                sizes="320px"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rose-950/20 to-transparent"
                aria-hidden
              />
              <span
                className={`absolute left-3 top-3 z-[1] rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${careerCardTagClassName("featured")}`}
              >
                Featured
              </span>
            </div>
            <div className="p-4">
              <p className="font-semibold text-cg-text group-hover:underline">{latestTitle}</p>
              <p className="mt-1 text-xs text-cg-muted">{latestMeta}</p>
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-cg-line bg-cg-card/50 p-4 text-sm text-cg-muted">
            Complete an assessment to unlock your personalized report card here.
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm font-bold text-cg-text">Your progress</h3>
        <div className="space-y-3">
          {progressItems.length ? (
            progressItems.map((item) => <ProgressRow key={item.title} item={item} />)
          ) : (
            <p className="text-sm text-cg-muted">Skill insights appear after your first full report.</p>
          )}
        </div>
      </div>
    </div>
  );
}
