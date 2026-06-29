# Appointment Availability Summary

Use this when the user provides a time range and wants available appointment options. The goal is to summarize all available expert and special-disease clinic slots in that range for the matched hospital/department context. General outpatient is documented but not queried by default because current access is unreliable.

## Appointment Categories

The SHDC MCP uses `registerType`:

| registerType | Category label | Meaning |
|---|---|---|
| `1` | 专家 | Expert clinic |
| `2` | 专病 | Special-disease/specialty clinic |
| `3` | 普通 | General outpatient clinic, currently unreliable; do not use by default |

If the user specifies expert or special-disease, query only that category. If the user does not specify one, decide between expert and special-disease based on triage context; if uncertain, query both `1` and `2` and merge the results with a category label.

Do not query `registerType=3` by default. If the user explicitly asks for general outpatient, explain that ordinary/general outpatient access is currently unreliable and offer expert/special-disease alternatives first.

Natural language mapping:

- "专家", "专家号", "专家门诊": `registerType=1`
- "专病", "专病门诊", "专科专病", "特色专病": `registerType=2`
- "普通", "普通号", "普通门诊", "门诊号": `registerType=3`

## Time Range Normalization

Convert natural language time into concrete filters:

- "今天", "明天", "后天": use exact dates based on current date.
- "本周", "这周": current week remaining dates.
- "下周": next Monday through Sunday.
- "周末": Saturday and Sunday.
- "上午": time segment `1` or morning status text.
- "下午": time segment `2` or afternoon status text.
- Explicit date ranges such as "6月28日到7月3日": convert to inclusive date range.

If the range is ambiguous, ask one concise question to clarify before querying.

## MCP Query Workflow

1. Ensure a hospital and department context exists. If missing, ask for the hospital or use the user's prior department recommendation to call:
   - `search_hospitals`
   - `search_departments`
2. Call `list_available_experts` for the matched hospital and department using the requested `registerType`; if no category is specified, call `1` and/or `2` according to the final triage recommendation. Do not call `3` unless the user explicitly insists on general outpatient.
3. For each returned expert/clinic item that has a usable id, call `list_expert_slots`.
4. Filter slots by the normalized date range and time segment.
5. Keep only available or partially available slots. Include status text if remaining count is not explicit.
6. Sort results by date, time segment, appointment category, hospital/branch, department, expert/item name.
7. If no slots match, say there are no matching slots in that time range and offer to broaden the date range or change hospital/department.

## Batch Handling

- Query all returned experts/items when the count is reasonable.
- If the expert/item list is large, process in batches of up to 10 experts/items and tell the user the summary is batch-based.
- After each batch, return matching slots found so far and offer to continue scanning the remaining experts.
- Never imply the summary is exhaustive unless all experts/items for all requested expert/special-disease categories were checked.

## Output Fields

For each matching slot, include:

- hospital/branch
- department
- appointment category: 专家 / 专病. Use 普通 only when explicitly requested by the user.
- expert or clinic item name
- expert title if available
- date
- time segment or time range
- remaining count or status text
- visit cost if available
- ids needed for later booking: `hospitalId`, `departmentId`, `expertId`, `slotId`, `registerType`

Do not hide available options behind a single recommendation unless the user asks for the best one.

## Output Template

```markdown
可预约汇总
- 查询范围：
- 医院/科室：
- 匹配结果数：

| 序号 | 医院/院区 | 科室 | 门诊类型 | 专家/门诊项 | 日期 | 时间 | 剩余号数/状态 | 费用 |
|---|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |  |

可用于继续预约的编号
- 1: registerType=..., hospitalId=..., departmentId=..., expertId=..., slotId=...

提示：如果你要继续预约，请告诉我选择第几个，以及是否已完成线下初诊/建档。
```

## First-use Rule

If this is the user's first use, or offline first visit/hospital registration is not confirmed, stop at this summary. Do not start registration, login, patient binding, SMS, captcha, or appointment submission.

After showing the summary, ask whether the user has not completed offline first visit/hospital registration or prefers to register by themselves. If yes, attach the selected hospital's WeChat/self-registration link from `hospital-wechat-links.md`. If multiple hospitals are listed, attach links for the hospitals shown in the summary when available.

## Safety

Appointment availability is not medical urgency. If red flags are present, recommend emergency care even if outpatient slots exist.
