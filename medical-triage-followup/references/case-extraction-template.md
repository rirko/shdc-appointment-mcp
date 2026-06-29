# Case Extraction Template

Use this for uploaded medical records, report photos, screenshots, PDFs, DOCX files, or pasted clinical text. Extract clinical content for care planning and follow-up, not only raw OCR text.

## Extraction Steps

1. Identify source type: PDF, image, screenshot, DOCX, or text.
2. Extract or OCR text. Use `ocr-guidelines.md` for cleanup.
3. Segment text into clinical sections.
4. Extract entities using `medical-entity-types.md`.
5. Build the clinical summary below.
6. Check record credibility and missing information with `record-quality-and-gaps.md`.
7. Build a timeline with `medical-timeline-template.md`.
8. Extract abnormal values and record-triggered red flags with `abnormal-and-red-flag-tracking.md`.
9. Generate pre-visit preparation and doctor questions with `pre-visit-and-doctor-questions.md`.
10. Mask direct identity fields in chat output.
11. Update or create the follow-up card.

## Clinical Summary Schema

```json
{
  "source_files": [
    {
      "filename": "",
      "type": "pdf|image|docx|screenshot|text",
      "document_type": "门诊病历|住院记录|出院小结|检查报告|检验报告|处方|病案首页|其他",
      "document_date": "",
      "hospital": "",
      "department": "",
      "doctor": "",
      "text_quality": "good|partial|poor",
      "warnings": []
    }
  ],
  "patient_context": {
    "name_masked": "",
    "sex": "",
    "age_or_birth_year": "",
    "identity_fields_masked": true,
    "special_risk_groups": []
  },
  "record_quality": {
    "overall_confidence": "high|medium|low",
    "basis": [],
    "limitations": [],
    "needs_user_verification": []
  },
  "clinical_summary": {
    "chief_complaint": "",
    "history_summary": "",
    "diagnoses_or_impressions": [],
    "exam_findings": [],
    "lab_results": [],
    "imaging_results": [],
    "procedures": [],
    "medications": [],
    "allergies": [],
    "doctor_advice": [],
    "follow_up_plan": [],
    "pending_questions": []
  },
  "missing_information": [
    {
      "item": "",
      "why_it_matters": "",
      "suggested_question": ""
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
  "abnormal_results": [
    {
      "name": "",
      "value": "",
      "unit": "",
      "reference_range": "",
      "abnormal_marker": "",
      "date": "",
      "source": "",
      "tracking_suggestion": ""
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
  "pre_visit_checklist": [],
  "doctor_questions": [],
  "risk_flags": [],
  "confidence": "high|medium|low"
}
```

## Required Output Behavior

- Preserve complete clinical information relevant to care and follow-up.
- Do not repeatedly show full ID number, phone, address, medical card number, payment number, barcode, QR code, or token.
- If OCR or text quality is low, state that the extraction needs user verification.
- Do not invent missing dates, doctors, diagnoses, medication names, medication doses, or lab reference ranges.
- If a report has abnormal values, preserve the value, unit, reference range if visible, abnormal marker if visible, and report date if visible.
- If a report has a critical or urgent warning, put the safety note before routine summaries.

## Visible Record Output

```markdown
病例整理
- 资料可信度：
- 主要问题：
- 关键诊断/印象：
- 重要检查结果：
- 当前治疗/用药：
- 医嘱与复诊：

缺失信息
- 

病情时间线
| 时间/顺序 | 事件 | 来源 | 可信度 |
|---|---|---|---|

异常检查值追踪
| 项目 | 结果 | 参考范围/标记 | 日期 | 建议追踪 |
|---|---|---|---|---|

病例触发红旗
- 

就诊前准备
- 

建议问医生的问题
1. 
```

## Follow-up Fields To Derive

- next visit date or interval
- tests to repeat
- medication review date
- symptoms to monitor
- warning signs requiring urgent care
- record quality and missing information
- abnormal values to track
- questions to ask the doctor
- department or doctor for follow-up
