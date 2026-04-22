import { redirect } from "next/navigation";

export default function OnboardingPage() {
  redirect("/overview?tab=assessments");
}
