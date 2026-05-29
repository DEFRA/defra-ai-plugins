# Planted PII fixture

This file deliberately contains UK personal identifiers that the `pii-scan`
hook must flag on `PostToolUse` of an `Edit` / `Write`. The values are
**fake** — they match the patterns but identify nobody.

- National Insurance number: AB123456C
- NHS number: 943 476 5919
- Postcode: SW1A 1AA
- Date of birth: 12/03/1985

The hook should warn (async, non-blocking) and name each pattern type.
