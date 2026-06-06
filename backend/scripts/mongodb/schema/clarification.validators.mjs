/**
 * MongoDB JSON Schema validators applied at collection level (Phase 7.5 clarification).
 * Mongoose performs additional validation at application layer.
 */
export const collectionValidators = {
  user_flow_sessions: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "flowId", "status", "currentPhase"],
      properties: {
        userId: { bsonType: "string", minLength: 1, maxLength: 128 },
        flowId: { bsonType: "string", enum: ["user-6", "user-6-pilot"] },
        status: {
          bsonType: "string",
          enum: ["in_progress", "clarification", "completed", "aborted"]
        },
        currentPhase: {
          bsonType: "string",
          enum: ["0", "1", "2", "3", "4", "5", "6", "7", "7.5", "8"]
        },
        constructSnapshot: { bsonType: ["object", "null"] },
        validityFlags: { bsonType: ["object", "null"] },
        telemetry: { bsonType: ["object", "null"] },
        accommodation: { bsonType: ["object", "null"] },
        intakeMeta: { bsonType: ["object", "null"] },
        startedAt: { bsonType: ["date", "null"] },
        completedAt: { bsonType: ["date", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      },
      additionalProperties: true
    }
  },

  clarification_sessions: {
    $jsonSchema: {
      bsonType: "object",
      required: ["flowSessionId", "userId", "status"],
      properties: {
        flowSessionId: { bsonType: "objectId" },
        userId: { bsonType: "string", minLength: 1, maxLength: 128 },
        status: {
          bsonType: "string",
          enum: ["evaluating", "in_progress", "finalized", "skipped"]
        },
        firedRules: { bsonType: "array", items: { bsonType: "string" } },
        assignedJourneys: { bsonType: "array", items: { bsonType: "string" } },
        maxJourneys: { bsonType: "int", minimum: 0, maximum: 3 },
        schemaVersion: { bsonType: "int", minimum: 1 },
        evaluatedAt: { bsonType: ["date", "null"] },
        finalizedAt: { bsonType: ["date", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      },
      additionalProperties: true
    }
  },

  clarification_responses: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clarificationSessionId", "userId", "journeyId", "itemId", "responseValue"],
      properties: {
        clarificationSessionId: { bsonType: "objectId" },
        userId: { bsonType: "string", minLength: 1, maxLength: 128 },
        journeyId: { bsonType: "string", minLength: 2, maxLength: 16 },
        itemId: { bsonType: "string", pattern: "^CLAR-" },
        itemVersion: { bsonType: "int", minimum: 1 },
        partialScore: { bsonType: ["double", "int", "null"], minimum: 0, maximum: 1 },
        responseTimeMs: { bsonType: ["int", "long", "null"], minimum: 0 },
        answerChangeCount: { bsonType: ["int", "long"], minimum: 0 },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      },
      additionalProperties: true
    }
  },

  clarification_sim_results: {
    $jsonSchema: {
      bsonType: "object",
      required: ["clarificationSessionId", "userId", "journeyId", "simId", "telemetry"],
      properties: {
        clarificationSessionId: { bsonType: "objectId" },
        userId: { bsonType: "string", minLength: 1, maxLength: 128 },
        journeyId: { bsonType: "string", minLength: 2, maxLength: 16 },
        simId: { bsonType: "string", pattern: "^SIM-" },
        telemetry: { bsonType: "object" },
        compositeScore: { bsonType: ["double", "int", "null"], minimum: 0, maximum: 1 },
        success: { bsonType: ["bool", "null"] },
        durationMs: { bsonType: ["int", "long", "null"], minimum: 0 },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      },
      additionalProperties: true
    }
  },

  clarification_item_exposure: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "itemId", "exposureCount"],
      properties: {
        userId: { bsonType: "string", minLength: 1, maxLength: 128 },
        itemId: { bsonType: "string", pattern: "^CLAR-" },
        exposureCount: { bsonType: "int", minimum: 0, maximum: 20 },
        lastExposedAt: { bsonType: "date" },
        stemHash: { bsonType: ["string", "null"], maxLength: 64 },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      },
      additionalProperties: true
    }
  }
};

export const allCollectionNames = Object.keys(collectionValidators);
