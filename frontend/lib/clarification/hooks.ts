"use client";

import { useCallback, useEffect } from "react";
import { useClarificationStore } from "./store";

export function useClarificationFlow(flowSessionId: string) {
  const store = useClarificationStore();

  useEffect(() => {
    if (flowSessionId) {
      void store.loadFlowState(flowSessionId);
    }
    return () => store.reset();
  }, [flowSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startClarification = useCallback(async () => {
    const evalResult = await store.runEvaluate(flowSessionId);
    if (!evalResult.skipped) {
      await store.fetchNext(flowSessionId);
    }
    return evalResult;
  }, [flowSessionId, store]);

  const answerAndContinue = useCallback(
    async (selectedOption: number) => {
      const { shouldContinue } = await store.submitAnswer(flowSessionId, selectedOption);
      if (shouldContinue) {
        await store.fetchNext(flowSessionId);
      } else {
        await store.runFinalize(flowSessionId);
      }
    },
    [flowSessionId, store]
  );

  const continueAfterSim = useCallback(async () => {
    await store.fetchNext(flowSessionId);
  }, [flowSessionId, store]);

  const finalize = useCallback(async () => {
    return store.runFinalize(flowSessionId);
  }, [flowSessionId, store]);

  return {
    ...store,
    startClarification,
    answerAndContinue,
    continueAfterSim,
    finalize
  };
}

export { useClarificationStore };
