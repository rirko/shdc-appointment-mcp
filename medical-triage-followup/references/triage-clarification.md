# Initial Triage Clarification

Use this when the user describes symptoms vaguely or asks what department to see.

## Goal

Turn a vague physical complaint into a clear triage request:

- urgency level
- main complaint
- relevant key facts
- likely department(s)
- MCP search keywords

Do not keep asking once the department can be reasonably selected.

## Loop Rules

- Ask one question per assistant turn.
- Start with the highest-value missing fact.
- Keep the current understanding internal during intermediate turns. Do not show a state card while still asking questions.
- A normal clarification block has at most 5 questions.
- If the user introduces a new key clue, start a new block of up to 5 questions focused on that clue.
- If a red flag appears, stop routine clarification and recommend emergency care or 120.

## New Key Clues

Start another 5-question block only when the user adds one of:

- a new body area
- a new symptom group
- a new abnormal report or diagnosis
- a new medication reaction
- a new high-risk factor
- a change in goal, such as from "understand symptoms" to "book appointment"

## Question Priority

1. Red flags: severe pain, breathing difficulty, weakness/numbness, altered consciousness, bleeding, severe allergy, severe trauma.
2. Main complaint: the symptom troubling the user most.
3. Location: exact body area and side.
4. Duration and onset: when it started, sudden or gradual.
5. Severity and function: pain score, walking/breathing/eating/sleeping impact.
6. Trigger and relief: injury, activity, food, fever, position, medicine.
7. Associated symptoms: fever, swelling, rash, numbness, vomiting, cough, chest tightness, urinary changes.
8. Background: age group, pregnancy, chronic disease, recent surgery, immune suppression, current medication.
9. User goal: emergency decision, department choice, expert lookup, appointment booking, record explanation, follow-up.

## Internal State

Track these fields internally during clarification:

```markdown
- 主诉：
- 已知症状：
- 缺失关键信息：
- 危险信号：
- 初步紧急程度：
- 候选科室：
```

Do not display this state during intermediate questioning. Display a concise summary only in the final triage recommendation or when the user explicitly asks what has been understood so far.

## Intermediate Question Format

During clarification, output only the next question, for example:

```markdown
疼痛具体在膝盖前方、内侧、外侧还是后方？
```

Avoid adding a full summary, department guess, or appointment suggestion until clarification is complete, unless a red flag appears.

## Stop Conditions

Stop routine clarification and move to advice when:

- emergency red flag is present
- a likely department can be selected
- the user asks to stop answering questions
- the 5-question block ends and there is enough information for a cautious department recommendation

If information remains insufficient after the block, say what is uncertain, recommend broad department keywords, and avoid definitive diagnosis.

## Final Triage Summary

When stopping clarification, include:

- symptom summary
- urgency
- recommended department(s)
- recommended appointment category: expert or special-disease
- MCP search keywords
- uncertainty
- what symptoms would require urgent care
- appointment offer: tell the user you can help query/book and ask for the hospital they want
