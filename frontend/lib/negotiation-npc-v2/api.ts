import { api } from "@/lib/api";
import type {
  NegotiationActionRequest,
  NegotiationResultPayload,
  NegotiationSessionView
} from "./types";

export async function startNegotiationSession(opts?: {
  flowSessionId?: string;
  clarificationSessionId?: string;
}): Promise<NegotiationSessionView> {
  const res = await api<NegotiationSessionView>("/simulations/negotiation-v2/sessions", {
    method: "POST",
    body: JSON.stringify(opts ?? {})
  });
  if (!res.data) throw new Error("Empty session response");
  return res.data;
}

export async function submitNegotiationAction(
  sessionId: string,
  payload: NegotiationActionRequest
): Promise<NegotiationSessionView> {
  const res = await api<NegotiationSessionView>(
    `/simulations/negotiation-v2/sessions/${sessionId}/actions`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
  if (!res.data) throw new Error("Empty action response");
  return res.data;
}

export async function completeNegotiationSession(
  sessionId: string
): Promise<NegotiationResultPayload> {
  const res = await api<NegotiationResultPayload>(
    `/simulations/negotiation-v2/sessions/${sessionId}/complete`,
    { method: "POST", body: JSON.stringify({}) }
  );
  if (!res.data) throw new Error("Empty complete response");
  return res.data;
}

export async function getNegotiationSession(sessionId: string): Promise<NegotiationSessionView> {
  const res = await api<NegotiationSessionView>(
    `/simulations/negotiation-v2/sessions/${sessionId}`
  );
  if (!res.data) throw new Error("Empty session fetch");
  return res.data;
}
