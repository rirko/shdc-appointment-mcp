# Triage Rules

Use these rules before case examples. They are for department selection and urgency, not final diagnosis.

## Emergency Red Flags

If any red flag is present, stop routine triage and advise emergency care or 120:

| Area | Red flags | Action |
|---|---|---|
| Chest/cardiac | crushing chest pain, chest pain with sweating, breathlessness, fainting, radiation to arm/jaw/back | Emergency/120 |
| Stroke/neurology | one-sided weakness or numbness, facial droop, speech difficulty, sudden severe headache, new confusion | Emergency/120 |
| Breathing/allergy | severe breathing difficulty, blue lips, throat swelling, widespread hives with wheeze/dizziness | Emergency/120 |
| Trauma | severe injury, deformity, cannot bear weight after injury, uncontrolled bleeding, head injury with vomiting/confusion | Emergency/120 |
| Abdomen | severe persistent abdominal pain, rigid abdomen, vomiting blood, black stool with weakness, suspected ectopic pregnancy | Emergency/120 |
| Infection | high fever with stiff neck, confusion, purple rash, severe weakness, rapidly worsening symptoms | Emergency/120 |
| Mental health | suicidal intent, homicidal intent, inability to stay safe | Emergency/120 or local crisis support |

High-risk users lower the threshold for urgent care: pregnancy, infant, elderly/frail, immunocompromised, major heart/lung/kidney/liver disease, cancer therapy, recent surgery.

## Department Mapping

| Symptom pattern | Preferred departments | MCP keywords | Notes |
|---|---|---|---|
| Joint pain, sports injury, chronic knee/shoulder/hip pain | Orthopedics, sports medicine, joint surgery | 骨科, 运动医学, 关节 | Ask trauma, swelling, weight bearing |
| Neck/back pain, limb numbness after spine symptoms | Orthopedics, spine surgery, neurology | 骨科, 脊柱, 神经内科 | Red flag: weakness, bowel/bladder dysfunction |
| Fracture suspicion, deformity, cannot bear weight | Emergency, orthopedics | 急诊, 骨科 | Red flag if acute trauma severe |
| Chest pain, palpitations, hypertension concern | Cardiology, emergency if red flags | 心内科, 心血管, 急诊 | Chest red flags override clinic |
| Cough, fever, wheeze, shortness of breath | Respiratory medicine, fever clinic, emergency if severe | 呼吸内科, 发热门诊 | Ask oxygen/breathing severity |
| Abdominal pain, reflux, diarrhea, constipation | Gastroenterology, emergency if severe | 消化内科, 胃肠 | Ask location, fever, bleeding |
| Urinary pain, blood urine, kidney stone history | Urology, nephrology | 泌尿外科, 肾内科 | Severe flank pain/fever may need urgent care |
| Headache, dizziness, numbness, tremor | Neurology, emergency if sudden/severe | 神经内科 | Stroke-like signs override clinic |
| Rash, itch, acne, skin infection | Dermatology | 皮肤科 | Anaphylaxis signs override clinic |
| Eye pain, vision change | Ophthalmology, emergency if sudden vision loss | 眼科 | Sudden vision loss urgent |
| Ear/nose/throat pain, hearing loss, sinus symptoms | ENT | 耳鼻喉科 | Breathing obstruction urgent |
| Menstrual, pregnancy, pelvic pain | Gynecology/obstetrics, emergency if severe pregnancy pain/bleeding | 妇科, 产科 | Pregnancy status matters |
| Child symptoms | Pediatrics, emergency if severe | 儿科 | Age changes thresholds |
| Diabetes, thyroid, metabolic issues | Endocrinology | 内分泌科 | Ask lab values and current meds |
| Anxiety, insomnia, low mood | Psychiatry/psychosomatic, emergency if self-harm risk | 精神科, 心身医学 | Safety first |

## Appointment Category Decision

At the end of triage, decide whether the appointment search should use expert or special-disease. Do not choose general outpatient as the final recommendation because current general outpatient access is unreliable.

Use expert (`registerType=1`) when:

- the symptom is broad or diagnosis is unclear
- the user wants a named doctor or higher-level evaluation
- multiple departments remain possible
- the problem may need specialist assessment but is not clearly a named special-disease clinic

Use special-disease (`registerType=2`) when:

- the user already has a clear diagnosis or report impression
- the symptom maps to a named specialty clinic, such as sports medicine, diabetes, thyroid nodule, hypertension, asthma, sleep apnea, breast nodule, spine disease, joint disease
- the user asks for a special clinic, disease-specific clinic, or follow-up for an existing condition

## Output Rule

When recommending departments, include:

- symptom summary
- urgency
- 1-3 departments
- recommended appointment category: expert or special-disease
- MCP keywords
- reason
- uncertainty
- what would change urgency
- appointment offer asking which hospital the user wants to book

Never say "you have X disease" based only on chat symptoms.
