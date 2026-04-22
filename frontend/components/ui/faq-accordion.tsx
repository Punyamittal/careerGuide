"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

const FAQ = [
  {
    q: "What does the assessment measure?",
    a: "Aptitude-style items, personality dimensions, career-interest themes, motivation, and a short writing prompt—combined into a profile for career matching."
  },
  {
    q: "Is my data private?",
    a: "Responses are tied to your account via Supabase Auth. Use a strong password and avoid sharing your login. Review your host's privacy policy for retention details."
  },
  {
    q: "Do I need a local AI model?",
    a: "No. Reports and chat may use Ollama when available, or fall back to OpenAI / rule-based content depending on your backend configuration."
  }
] as const;

export function FaqAccordion() {
  return (
    <Accordion className="w-full" type="single" collapsible defaultValue="item-0">
      {FAQ.map((item, i) => (
        <AccordionItem key={item.q} className="mb-3 last:mb-0" value={`item-${i}`}>
          <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
          <AccordionContent>
            <p className="leading-relaxed">{item.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
