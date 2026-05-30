import { EVENT_LIBRARY, UNIVERSAL_EVENTS } from "./taxonomy";
import { EVENT_TYPE_EVENTS, SUBCATEGORY_EVENT_MAP } from "./subcategory-events";
import type { EventDomainId, EventTypeId } from "./types";

export type EventFilterInput = {
  domain?: EventDomainId;
  subcategory?: string;
  eventType?: EventTypeId;
  search?: string;
};

/**
 * Dynamic event catalog: domain + subcategory + event type + search.
 */
export function getFilteredEventOptions({
  domain,
  subcategory,
  eventType,
  search
}: EventFilterInput): string[] {
  const pool = new Set<string>();

  for (const ev of UNIVERSAL_EVENTS) pool.add(ev);

  if (domain) {
    for (const ev of EVENT_LIBRARY[domain] ?? []) pool.add(ev);
    const subMap = SUBCATEGORY_EVENT_MAP[domain];
    if (subcategory && subMap?.[subcategory]) {
      for (const ev of subMap[subcategory]) pool.add(ev);
    }
  }

  if (eventType) {
    for (const ev of EVENT_TYPE_EVENTS[eventType] ?? []) pool.add(ev);
  }

  let list = [...pool];

  if (domain && subcategory) {
    const subSpecific = SUBCATEGORY_EVENT_MAP[domain]?.[subcategory] ?? [];
    const subSet = new Set(subSpecific);
    const prioritized = [
      ...subSpecific,
      ...list.filter((e) => !subSet.has(e))
    ];
    list = [...new Set(prioritized)];
  }

  const q = search?.trim().toLowerCase();
  if (q) {
    list = list.filter((e) => e.toLowerCase().includes(q));
  }

  return list.slice(0, 48);
}
