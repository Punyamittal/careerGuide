import { api } from "@/lib/api";
import type { LifeEventRecord } from "./types";

type ApiEvent = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lifeStage: LifeEventRecord["lifeStage"];
  eventType: LifeEventRecord["eventType"];
  domain: LifeEventRecord["domain"];
  subcategory: string;
  eventLabel: string;
  customEvent?: boolean;
  customDescription?: string;
  emotionalTone?: LifeEventRecord["emotionalTone"];
  behavioralSignals?: string[];
  impacts: LifeEventRecord["impacts"];
  intensity: LifeEventRecord["intensity"];
  emotions: LifeEventRecord["emotions"];
  reflectionLens: LifeEventRecord["reflectionLens"];
  signalMap: LifeEventRecord["signalMap"];
  notes?: string;
};

const toRecord = (e: ApiEvent): LifeEventRecord => ({
  id: e.id,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  lifeStage: e.lifeStage,
  eventType: e.eventType,
  domain: e.domain,
  subcategory: e.subcategory,
  eventLabel: e.eventLabel,
  customEvent: e.customEvent,
  customDescription: e.customDescription,
  emotionalTone: e.emotionalTone,
  behavioralSignals: e.behavioralSignals,
  impacts: e.impacts,
  intensity: e.intensity,
  emotions: e.emotions,
  reflectionLens: e.reflectionLens,
  signalMap: e.signalMap,
  notes: e.notes
});

export async function fetchLifeJourneyEvents(): Promise<LifeEventRecord[]> {
  try {
    const res = await api<{ events: ApiEvent[] }>("/life-journey/events");
    if (!res.success || !res.data?.events) return [];
    return res.data.events.map(toRecord);
  } catch {
    return [];
  }
}

export async function syncLifeJourneyEvent(event: LifeEventRecord): Promise<void> {
  try {
    await api("/life-journey/events", {
      method: "POST",
      body: JSON.stringify({
        lifeStage: event.lifeStage,
        eventType: event.eventType,
        domain: event.domain,
        subcategory: event.subcategory,
        eventLabel: event.eventLabel,
        customEvent: event.customEvent,
        customDescription: event.customDescription,
        emotionalTone: event.emotionalTone,
        behavioralSignals: event.behavioralSignals,
        impacts: event.impacts,
        intensity: event.intensity,
        emotions: event.emotions,
        reflectionLens: event.reflectionLens,
        signalMap: event.signalMap,
        notes: event.notes
      })
    });
  } catch {
    /* local persist remains source of truth until migration applied */
  }
}

export async function deleteLifeJourneyEvent(eventId: string): Promise<void> {
  try {
    await api(`/life-journey/events/${eventId}`, { method: "DELETE" });
  } catch {
    /* local store already updated */
  }
}
