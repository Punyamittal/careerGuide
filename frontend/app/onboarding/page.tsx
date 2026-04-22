import { redirect } from "next/navigation";

type OnboardingPageProps = {
  searchParams?: Promise<{ track?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = (await searchParams) ?? {};
  const track = typeof params.track === "string" ? params.track : "career_g11";
  redirect(`/assessment?track=${track}`);
}
