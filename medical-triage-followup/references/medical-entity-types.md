# Medical Entity Types

Use these entity types for record extraction and follow-up cards. ICD coding is optional and not required in v1.

| Type | Meaning | Examples | Use |
|---|---|---|---|
| `disease` | Disease or diagnosis | 肺炎, 2型糖尿病, 高血压, 肝硬化 | Diagnosis/impression |
| `symptom` | Symptom or sign | 发热, 咳嗽, 胸痛, 呼吸困难, 腹痛 | Triage and follow-up |
| `anatomy` | Body area or organ | 膝关节, 肝, 腰椎, 胃, 门静脉 | Department routing |
| `lab_value` | Lab indicator/result | 白细胞升高, 血糖 12 mmol/L, HBV-DNA 1.20E+4 | Tracking and abnormal flags |
| `imaging_finding` | Imaging result | 肺部感染影, 半月板损伤提示, 肝脏占位 | Follow-up and department choice |
| `medication` | Drug/substance | 阿司匹林, 胰岛素, 抗生素, TMF | Medication list and reactions |
| `procedure` | Surgery/procedure | PCI, 胃镜, 关节镜, 介入治疗 | History and follow-up |
| `severity` | Severity/stage/type | 急性, 重度, 3级, 2型, 危急 | Refines clinical summary |
| `laterality` | Side | 左, 右, 双侧 | Refines anatomy and symptoms |
| `complication` | Complication | 酮症酸中毒, 腹水, 癌栓, 出血 | Risk and follow-up |
| `comorbidity` | Coexisting condition | 糖尿病, 冠心病, 乙型肝炎 | Risk threshold |
| `allergy` | Allergy/intolerance | 青霉素过敏, 阿司匹林过敏 | Safety |

## Extraction Principles

- Keep the original wording and a normalized name when useful.
- Preserve context around each important entity.
- Separate modifiers from core entities: "右侧急性膝关节疼痛" includes laterality `右侧`, severity/onset `急性`, anatomy `膝关节`, symptom `疼痛`.
- Extract medication dose and frequency only when visible in the source.
- Mark uncertainty when OCR is unclear.
- Preserve report markers such as `异常`, `危急`, `H`, `L`, `A`, `↑`, and `↓` with the related lab or imaging item.

## Relationship Hints

- `located_at`: disease/symptom at anatomy.
- `treated_by`: disease/symptom treated by medication/procedure.
- `complicated_by`: disease complicated by complication.
- `has_severity`: disease/symptom with severity.
- `has_laterality`: anatomy/symptom with side.
- `evidenced_by`: diagnosis/impression supported by lab, imaging, pathology, or procedure.
