# SHDC Appointment MCP

TypeScript MCP stdio server for the Shanghai SHDC appointment site.

This server keeps the user in the loop for all captcha, SMS, patient identity, and final submission steps. It does not bypass verification or submit a registration without explicit confirmation.

This repository also includes the `medical-triage-followup` Codex skill for Chinese medical triage, medical record extraction, follow-up cards, and SHDC appointment guidance. See [MEDICAL_TRIAGE_FOLLOWUP_SKILL_README.md](MEDICAL_TRIAGE_FOLLOWUP_SKILL_README.md) for the detailed skill documentation.

## Setup

```bash
npm install
npm run build
```

Run with:

```bash
npm start
```

For local development:

```bash
npm run dev
```

## Data Storage

Session data is stored locally under `.shdc-appointment-mcp/session.enc.json`, encrypted with a key derived from the current OS user and machine identity.

## Safety

The server masks phone numbers and document numbers in tool responses and logs. It stores the access token only in encrypted local storage.

## MCP Client Configuration

After `npm run build`, configure your MCP client to launch:

```json
{
  "mcpServers": {
    "shdc-appointment": {
      "command": "node",
      "args": ["C:/Users/RIRKO/Documents/医疗agent/dist/index.js"]
    }
  }
}
```

## Typical Chat Flow

1. Before account registration, ask whether the user has already completed an offline first visit / hospital registration at the target hospital. If yes, use `register_start`, `register_next`, `register_get_captcha`, `register_send_sms_code`, `register_confirm`, and `register_submit`. If no, do not register; only use search tools to return hospital location, available experts, and appointment slots.
2. Call `auth_get_captcha`, read the returned image, then call `auth_send_sms_code`.
3. Call `auth_login` with the SMS code. The access token is saved locally.
4. Call `search_hospitals`, `search_departments`, `list_available_experts`, and `list_expert_slots`.
5. Call `list_patients`; if needed, use `patient_add_start` and `patient_add_next`.
6. Call `appointment_start`, then `appointment_next` to select patient, get captcha, send SMS, and provide the SMS code.
7. Call `appointment_confirm` with `confirm=true`.
8. Call `appointment_submit`.

## Registration Flow

The account registration tools wrap the official real-name registration flow. The first registration field is `offlineFirstVisit`; the MCP must confirm the user has already completed an offline first visit / hospital registration before collecting registration PII. If the user answers no, the registration flow is closed and the assistant should only provide hospital location, available experts, and appointment slot information.

The tools do not bypass captcha, SMS verification, or agreement confirmation. `register_submit` only submits after `register_confirm` has been called with `confirm=true`, and it does not automatically log in with the user's password.

## Testing Notes

- Keep one MCP stdio process alive for a full flow. `flowId` values are in-memory state, so they will not survive restarting the MCP process between tool calls.
- The search tools match hospital and department names returned by the official site. They do not diagnose symptoms or map a symptom such as "fracture" to a hospital automatically.
- On Windows, ad-hoc PowerShell test scripts may corrupt Chinese arguments or file paths if piped with the wrong encoding. Prefer a real MCP client session, or write helper command files as UTF-8 without BOM.
