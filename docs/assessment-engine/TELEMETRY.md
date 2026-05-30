# Telemetry Event Schema

## Event types

| `event_type` | When |
|--------------|------|
| `session_start` | Module loaded |
| `stimulus_present` | Item shown |
| `response` | User answered / moved / traced |
| `response_timeout` | No response within limit |
| `hint_shown` | Adaptive hint |
| `item_complete` | Item scored |
| `module_complete` | All items done |
| `session_abort` | User exited early |

## Payload (`assessment_telemetry_events`)

```json
{
  "sessionId": "uuid",
  "moduleId": "M01",
  "itemId": "M-027",
  "eventType": "response",
  "stimulusId": "M-027-v1",
  "responseValue": 4,
  "responseCorrect": null,
  "responseTimeMs": 2340,
  "attemptIndex": 1,
  "difficultyLevel": 2,
  "engineType": "likert",
  "metadata": {
    "widget": "semantic_differential",
    "poleLeft": "Fixed mindset",
    "poleRight": "Growth mindset"
  }
}
```

### Engine-specific `metadata`

**tracing (T4):**
```json
{
  "pathPoints": [[12, 45], [14, 48], ...],
  "pathLengthPx": 892,
  "deviationScore": 0.18,
  "completionPct": 1.0
}
```

**reaction_time (T5):**
```json
{
  "trialIndex": 12,
  "condition": "incongruent",
  "word": "RED",
  "inkColor": "blue"
}
```

**branching (M11/M12):**
```json
{
  "scenarioId": "L-001-SJT",
  "optionKey": "b",
  "branchDepth": 1
}
```

## Client batch format

`POST /api/v1/assessment/sessions/:id/telemetry`

```json
{
  "events": [ /* up to 50 events */ ],
  "clientSeq": 42,
  "adaptiveState": {
    "difficulty": 2,
    "streakCorrect": 3,
    "itemsCompleted": 7
  }
}
```

## Aggregates → scoring

| Metric | Source events | Used for |
|--------|---------------|----------|
| `accuracy` | `response.responseCorrect` | Adaptive router |
| `mean_rt_ms` | `response.responseTimeMs` | Processing speed construct |
| `attempts_per_item` | max `attemptIndex` per item | Persistence / grit proxy |
| `difficulty_reached` | max `difficultyLevel` | Module summary |
