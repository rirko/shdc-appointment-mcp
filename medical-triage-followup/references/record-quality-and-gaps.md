# Record Quality and Missing Information

Use this after extracting a medical record. The goal is to tell the user how reliable the extracted summary is and what is missing before follow-up or appointment planning.

## Credibility Levels

| Level | Use when |
|---|---|
| `high` | Official record/report text is readable; document type and clinical sections are clear; key results include dates or source sections; identity fields are masked without losing clinical meaning. |
| `medium` | Most clinical content is readable but some dates, units, source sections, or page context are missing; OCR or copied text has minor uncertainty. |
| `low` | Image/text quality is poor; core diagnosis/result is incomplete; important pages are missing; the user paraphrased the record without original report details. |

Do not infer high credibility only because the content sounds plausible. Base confidence on source quality and completeness.

## Quality Checks

- Source: official report, discharge summary, outpatient note, prescription, user paraphrase, or screenshot.
- Date: document date, symptom onset date, test date, report date, and discharge date when relevant.
- Completeness: whether the record includes chief complaint, diagnosis/impression, key tests, treatment, medications, advice, and follow-up.
- Numeric fidelity: whether lab values include unit, reference range, and abnormal marker.
- Internal consistency: whether diagnoses, departments, dates, and medications conflict across documents.
- OCR risk: whether words, numbers, units, or laterality may be misread.

## Missing Information Categories

List only missing details that affect next action:

| Category | Examples | Why it matters |
|---|---|---|
| Time | onset date, report date, treatment date, discharge date | Builds timeline and urgency |
| Source | hospital, department, document type, doctor | Affects credibility and appointment routing |
| Key result details | value, unit, reference range, abnormal marker, imaging conclusion | Needed for abnormal tracking |
| Current status | symptoms now, fever now, pain level, breathing, weight change | Determines urgency |
| Treatment | medication name, dose, frequency, start/stop date, surgery/procedure | Prevents unsafe advice |
| Follow-up plan | review interval, repeat tests, target department | Drives reminders |
| Risk context | pregnancy, age group, chronic disease, immune status, allergy | Lowers urgent-care threshold |

## Output Template

```markdown
资料可信度与缺失信息
- 可信度：high / medium / low
- 判断依据：
- 主要限制：
- 需要你补充的信息：
  1. 问题：
     - 为什么需要：
```

Ask at most 3 missing-information questions at once unless the user explicitly wants a full audit.
