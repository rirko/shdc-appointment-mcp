# OCR Guidelines

Use this for medical images, screenshots, scanned PDFs, and DOCX files whose text was copied from images.

## OCR Strategy

- Prefer the host model's vision/OCR capability if no local OCR tool is available.
- If the user provides selectable PDF/DOCX text, use that text before OCR.
- For multi-page PDFs or image sets, process pages in order and merge cross-page sections.
- Preserve table row relationships such as item, result, unit, reference range, and abnormal marker.

## Cleanup Rules

Remove or down-rank:

- repeated hospital watermarks
- page headers and footers
- pure page numbers
- barcodes, QR code text, URLs
- repeated table borders
- payment numbers unrelated to clinical care

Preserve:

- patient age/sex when clinically relevant
- document date
- hospital, department, doctor
- diagnosis/impression
- medication name, dose, route, frequency if visible
- lab value, unit, reference range, abnormal marker
- imaging conclusion
- follow-up advice
- urgency wording such as `危急`, `急诊`, `立即就医`, `尽快复诊`

## Common Chinese Medical OCR Corrections

| OCR error | Likely correction | Note |
|---|---|---|
| 肺/市混淆 | 肺 | Radical confusion |
| 支 气管 | 支气管 | Split word |
| 肝/旰混淆 | 肝 | Radical confusion |
| 胆/但混淆 | 胆 | Radical confusion |
| O/0 | depends on context | Letters vs digits |
| I/1/l | depends on context | Letters vs digits |
| S/5 | depends on context | Letters vs digits |

Only correct when context is strong. If uncertain, preserve the original and mark a warning.

## Segmentation

Look for section markers:

- 主诉
- 现病史
- 既往史
- 过敏史
- 体格检查
- 辅助检查
- 诊断 / 初步诊断 / 出院诊断
- 检查所见
- 印象 / 检查意见
- 检验结果
- 处理 / 治疗 / 用药
- 医嘱
- 复诊 / 随访

For tables, keep row-level associations such as item, result, unit, reference range, and abnormal marker.

## Quality Checks

- Does the extracted text preserve clinical meaning?
- Are dates and sections in the correct order?
- Are medication names and doses readable?
- Are abnormal lab values tied to units and reference ranges?
- Are non-clinical identifiers masked in the final chat output?
- Are urgent or critical report words carried into the red-flag scan?
