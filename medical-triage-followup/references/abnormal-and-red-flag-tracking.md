# Abnormal Values and Record Red Flags

Use this after record extraction. The goal is to track abnormal results and surface urgent findings from the record without over-diagnosing.

## Abnormal Result Rules

Prefer explicit evidence in the report:

- abnormal labels: `异常报告`, `危急报告`, `异常提示`
- markers: `↑`, `↓`, `H`, `L`, `A`, `阳性（+）`
- visible reference ranges
- clinician wording such as `明显升高`, `降低`, `危急值`, `需复查`

If no reference range or marker is visible, record the value but do not label it abnormal unless the report itself does.

## Abnormal Result Output

```markdown
异常检查值追踪
| 项目 | 结果 | 单位 | 参考范围/标记 | 日期 | 来源 | 建议追踪 |
|---|---|---|---|---|---|---|
```

Tracking suggestions should be conservative:

- repeat according to doctor advice
- bring original report to the relevant department
- ask whether medication or treatment changes are needed
- monitor related symptoms named in the record

Do not recommend medication dose changes unless they are written in the record.

## Record-triggered Red Flags

Treat these as urgent signals when present in records:

| Area | Record evidence | Action |
|---|---|---|
| Critical lab | `危急报告`, `危急值`, severe electrolyte/glucose/blood count abnormality explicitly flagged | Recommend urgent clinical review or emergency care depending on wording/symptoms |
| Heart/chest | chest pain with sweating, fainting, severe dyspnea, suspected myocardial infarction | Emergency/120 |
| Stroke/brain | acute intracranial hemorrhage, acute infarction, one-sided weakness, speech disorder, altered consciousness | Emergency/120 |
| Breathing/allergy | severe breathing difficulty, low oxygen, airway swelling, anaphylaxis | Emergency/120 |
| Trauma/orthopedics | displaced fracture, severe deformity, cannot bear weight after injury, uncontrolled bleeding | Emergency/120 or emergency department |
| Infection | sepsis concern, high fever with confusion/stiff neck, rapidly worsening infection | Emergency/urgent care |
| Abdomen/bleeding | vomiting blood, black stool with weakness, rigid abdomen, suspected ectopic pregnancy | Emergency/120 |
| Oncology/liver | cancer thrombus, obstructive jaundice, ascites with fever, rapid deterioration, massive bleeding risk | Urgent specialist review; emergency if severe symptoms |
| Clinician instruction | `立即就医`, `急诊`, `尽快住院`, `危急`, `需紧急处理` | Follow the recorded urgency |
| Mental health | suicidal or homicidal intent, inability to stay safe | Emergency/120 or local crisis support |

## Response Order

If a record red flag is present:

1. Start with a short urgent safety note.
2. State the exact evidence from the record in plain language.
3. Recommend emergency care, urgent specialist review, or same-day contact according to severity.
4. Then continue with the normal record summary and follow-up card.

Never use outpatient appointment availability to downgrade an emergency red flag.
