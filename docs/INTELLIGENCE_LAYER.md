# Intelligence Layer

## Messy Inputs
- Licence PDFs with varied formats
- Free-text notes in renewal logs
- Inconsistent category naming across outlets

## Auto-Structure Schema (JSON example)
```json
{
  "licence_name": "Food Shop Licence",
  "category": "Food Hygiene",
  "renewal_period_months": 12,
  "renewal_period_months_source": "ai_doc_parse",
  "renewal_period_months_confidence": 0.87,
  "renewal_period_months_review_status": "unreviewed",
  "risk_level": "high",
  "risk_level_source": "rule_based",
  "risk_level_confidence": 1.0,
  "risk_level_review_status": "approved"
}
```

## Events to Track
- Licence created / edited / deleted
- Renewal log entry added
- Expiry crossed (status changes to expired)
- AI field reviewed / overridden

## Scoring Rules (rule-based first)
| Rule | Risk Level |
|------|------------|
| Expired | critical |
| ≤7 days to expiry | critical |
| ≤30 days to expiry | high |
| ≤60 days to expiry | medium |
| > 60 days to expiry | low |

## What Gets Ranked
- Dashboard sorts by risk_level desc, then days-to-expiry asc

## v1 vs Later
- **v1:** Rule-based status + risk scoring only
- **Later:** LLM parses uploaded PDF → suggests category + renewal period; AI drafts renewal reminder copy; review queue for AI-generated fields
