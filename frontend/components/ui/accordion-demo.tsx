"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

/** Minimal demo matching the reference snippet — use in Storybook or a dev page. */
export function AccordionDemo() {
  return (
    <Accordion className="w-full lg:w-[unset]" type="single" collapsible>
      <AccordionItem className="max-w-full lg:w-[500px]" value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
