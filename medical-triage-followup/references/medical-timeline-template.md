# Medical Timeline Template

Use this to convert one or more records into a disease timeline. The timeline should help the user and clinician quickly see what happened, when, and what still needs follow-up.

## Event Types

| Type | Examples |
|---|---|
| `symptom` | fever started, pain worsened, chest tightness appeared |
| `visit` | outpatient visit, emergency visit, follow-up visit |
| `test` | blood test, tumor marker, HBV-DNA, liver/kidney function |
| `imaging` | ultrasound, CT, MRI, X-ray, endoscopy report |
| `diagnosis` | initial diagnosis, discharge diagnosis, report impression |
| `treatment` | medication plan, conservative treatment, chemotherapy, radiotherapy |
| `hospitalization` | admission, discharge, transfer department |
| `procedure` | surgery, biopsy, intervention, endoscopy |
| `medication` | medication started, stopped, dose changed |
| `followup` | repeat test, clinic review, referral advice |

## Build Rules

- Use exact dates when visible.
- If dates are masked or missing, use sequence labels such as `最早记录`, `随后`, `住院期间`, `出院后`, or `当前`.
- Merge duplicate events only when they clearly refer to the same clinical event.
- Preserve uncertainty: `日期已脱敏`, `来源未见`, `OCR不清`.
- Keep source labels short: `门诊病历`, `MRI报告`, `检验摘录`, `住院病案首页`, `出院小结`.
- Do not invent cause-effect relationships. Write "记录提示" or "报告印象为" when the relationship comes from the document.

## Timeline Output

```markdown
病情时间线
| 时间/顺序 | 事件类型 | 关键内容 | 来源 | 可信度 |
|---|---|---|---|---|
|  |  |  |  |  |
```

## JSON Event Shape

```json
{
  "date_or_sequence": "",
  "event_type": "symptom|visit|test|imaging|diagnosis|treatment|hospitalization|procedure|medication|followup",
  "summary": "",
  "source": "",
  "confidence": "high|medium|low"
}
```

## Multi-record Merge

When records conflict:

- Prefer later official records for current status.
- Keep earlier records when they explain onset, diagnosis history, or prior treatment.
- Note the conflict in `missing_information` or `open_questions`.
- Do not delete an old diagnosis unless the later record explicitly rules it out or the user corrects it.
