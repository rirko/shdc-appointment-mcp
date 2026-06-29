# Follow-up Card Template

Use a follow-up card whenever the user uploads records, asks for follow-up tracking, or changes symptoms after a prior summary.

The card must be visible. Do not store it only in hidden reasoning.

## Markdown Card

```markdown
随访提醒卡
- 当前问题：
- 相关诊断/印象：
- 资料可信度：
- 关键缺失信息：
- 病情时间线摘要：
- 关键检查结果：
- 异常值追踪：
- 当前用药：
- 医嘱/注意事项：
- 下次复诊：
- 需要复查：
- 需要立即就医的情况：
- 就诊前准备：
- 建议问医生的问题：
- 待确认问题：
```

## JSON Card

```json
{
  "followup_card_version": "1.1",
  "updated_at": "",
  "patient_summary": {
    "identity_masked": true,
    "age_or_group": "",
    "sex": "",
    "key_risk_factors": []
  },
  "record_quality": {
    "overall_confidence": "high|medium|low",
    "limitations": [],
    "missing_information": []
  },
  "conditions": [
    {
      "name": "",
      "status": "suspected|confirmed|history|unknown",
      "source": "",
      "notes": ""
    }
  ],
  "timeline_events": [
    {
      "date_or_sequence": "",
      "event_type": "symptom|visit|test|imaging|diagnosis|treatment|hospitalization|procedure|medication|followup",
      "summary": "",
      "source": "",
      "confidence": "high|medium|low"
    }
  ],
  "symptoms_to_track": [
    {
      "symptom": "",
      "baseline": "",
      "worsening_threshold": ""
    }
  ],
  "medications": [
    {
      "name": "",
      "dose": "",
      "frequency": "",
      "start_or_end": "",
      "source": "",
      "needs_confirmation": false
    }
  ],
  "tests_to_follow": [
    {
      "test": "",
      "last_result": "",
      "unit": "",
      "reference_range": "",
      "abnormal_marker": "",
      "date": "",
      "next_due": "",
      "notes": ""
    }
  ],
  "record_red_flags": [
    {
      "flag": "",
      "evidence": "",
      "recommended_action": "",
      "urgency": "emergency|urgent|soon"
    }
  ],
  "next_visit": {
    "date_or_interval": "",
    "department": "",
    "doctor_or_level": "",
    "purpose": ""
  },
  "pre_visit_checklist": [],
  "doctor_questions": [],
  "reminders": [
    {
      "type": "visit|test|medication|symptom|document|question",
      "due": "",
      "text": "",
      "target_app_hint": ""
    }
  ],
  "risk_flags": [],
  "source_files": [],
  "open_questions": []
}
```

## Update Rules

- Merge new facts with existing card content.
- Preserve source and date for important facts when known.
- Mark uncertain or OCR-derived facts as needing confirmation.
- Do not delete old conditions unless the user explicitly corrects them.
- Keep direct identity fields masked.
- Preserve abnormal result history even when a later value improves.
