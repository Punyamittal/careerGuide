import { redirect } from "next/navigation";

export default function CareerPage() {
  redirect("/overview?tab=career-matches");
}
