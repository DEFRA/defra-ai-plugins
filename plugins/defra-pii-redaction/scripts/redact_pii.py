# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = [
#     "click==8.1.8",
#     "presidio-analyzer==2.2.362",
#     "presidio-anonymizer==2.2.362",
#     "spacy==3.8.13",
# ]
# ///
"""
PII redaction hook script for Claude Code / GitHub Copilot.

Contract:
  stdin  — full hook payload JSON (UserPromptSubmit / PreToolUse / PostToolUse)
  stdout — same JSON structure with PII replaced by typed placeholders
  exit 0 — always (redaction failures pass through unredacted rather than blocking)

Click Commands:
  redact-command  Process stdin payload and redact PII (default when no subcommand)
  preload         Download spaCy model and warm up engines
  warn            Check for PII in stdin payload and emit warnings (pass-through mode)

Examples:
  uv run redact_pii.py                  # hook mode (default)
  uv run redact_pii.py redact-command   # explicit hook mode
  uv run redact_pii.py preload          # preload spaCy model
  uv run redact_pii.py warn             # check for PII and warn
"""

import hashlib
import json
import os
import sys
import urllib.request
import zipfile
from pathlib import Path
from typing import Any

import click
import presidio_analyzer
import presidio_analyzer.predefined_recognizers
import presidio_anonymizer


SPACY_MODEL: str = "en_core_web_sm"
SPACY_WHEEL_URL: str = "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl"
SPACY_WHEEL_SHA256: str = "1932429db727d4bff3deed6b34cfc05df17794f4a52eeb26cf8928f7c1a0fb85"
CACHE_DIR: Path = Path(os.getenv("XDG_CACHE_HOME", Path.home() / ".cache")) / "defra-pii-redaction"
CACHED_WHEEL: Path = CACHE_DIR / "en_core_web_sm-3.8.0-py3-none-any.whl"

ENTITIES: list[str] = [
    "CREDIT_CARD",
    "CRYPTO",
    "EMAIL_ADDRESS",
    "IBAN_CODE",
    "IP_ADDRESS",
    "MAC_ADDRESS",
    "NRP",
    "LOCATION",
    "PERSON",
    "PHONE_NUMBER",
    "MEDICAL_LICENSE",
    "UK_NHS",
    "UK_NINO",
    "UK_PASSPORT",
    "UK_POSTCODE",
    "UK_VEHICLE_REGISTRATION",
    "SBI",
    "CRN",
    "CPH",
]

sbi_recognizer = presidio_analyzer.PatternRecognizer(
    supported_entity="SBI",
    context=["SBI", "Single Business Identifier"],
    patterns=[
        presidio_analyzer.Pattern(
            "SBI", r"(10[5-9]\d{6}|1[1-9]\d{7}|[2-9]\d{8})", score=0.5
        ),
    ],
)

crn_recognizer = presidio_analyzer.PatternRecognizer(
    supported_entity="CRN",
    context=["CRN", "Customer Reference Number"],
    patterns=[
        presidio_analyzer.Pattern(
            "CRN", r"(10[5-9]\d{6}|1[1-9]\d{7}|[2-9]\d{8})/\d{2}/\d{3}/\d{4}", score=0.5
        ),
    ],
)

cph_recognizer = presidio_analyzer.PatternRecognizer(
    supported_entity="CPH",
    context=["CPH", "County Parish Holding"],
    patterns=[
        presidio_analyzer.Pattern(
            "CPH", r"\d{2}/\d{3}/\d{4}", score=0.5
        ),
    ],
)


def _build_analyzer() -> presidio_analyzer.AnalyzerEngine:
    registry = presidio_analyzer.RecognizerRegistry()
    registry.load_predefined_recognizers()
    registry.remove_recognizer("UrlRecognizer")

    uk = presidio_analyzer.predefined_recognizers.country_specific.uk

    registry.add_recognizer(uk.UkNinoRecognizer())
    registry.add_recognizer(uk.UkPostcodeRecognizer())
    registry.add_recognizer(uk.UkPassportRecognizer())
    registry.add_recognizer(uk.UkVehicleRegistrationRecognizer())

    registry.add_recognizer(
        presidio_analyzer.predefined_recognizers.PhoneRecognizer(
            supported_regions=["GB"],
        )
    )

    registry.add_recognizer(sbi_recognizer)
    registry.add_recognizer(crn_recognizer)
    registry.add_recognizer(cph_recognizer)

    nlp_engine = presidio_analyzer.nlp_engine.NlpEngineProvider(
        nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": SPACY_MODEL}],
        }
    ).create_engine()

    return presidio_analyzer.AnalyzerEngine(
        nlp_engine=nlp_engine,
        registry=registry,
        supported_languages=["en"],
    )


def _build_anonymizer() -> presidio_anonymizer.AnonymizerEngine:
    return presidio_anonymizer.AnonymizerEngine()


def _redact_text(
    text: str,
    analyzer: presidio_analyzer.AnalyzerEngine,
    anonymizer: presidio_anonymizer.AnonymizerEngine,
) -> str:
    results = analyzer.analyze(text=text, language="en", entities=ENTITIES)

    if not results:
        return text

    anonymized = anonymizer.anonymize(text=text, analyzer_results=results)

    return anonymized.text


def _redact_value(
    value: Any,
    analyzer: presidio_analyzer.AnalyzerEngine,
    anonymizer: presidio_anonymizer.AnonymizerEngine,
) -> Any:
    if isinstance(value, str):
        return _redact_text(value, analyzer, anonymizer)

    if isinstance(value, dict):
        return {k: _redact_value(v, analyzer, anonymizer) for k, v in value.items()}

    if isinstance(value, list):
        return [_redact_value(item, analyzer, anonymizer) for item in value]

    return value


def redact_payload(payload: dict[str, Any]) -> dict[str, Any]:
    analyzer = _build_analyzer()
    anonymizer = _build_anonymizer()

    return _redact_value(payload, analyzer, anonymizer)


def _warn_text(
    text: str,
    analyzer: presidio_analyzer.AnalyzerEngine,
) -> list[str]:
    results = analyzer.analyze(text=text, language="en", entities=ENTITIES)

    return [r.entity_type for r in results]


def _warn_value(
    value: Any,
    analyzer: presidio_analyzer.AnalyzerEngine,
    found: list[str],
) -> None:
    if isinstance(value, str):
        found.extend(_warn_text(value, analyzer))
    elif isinstance(value, dict):
        for v in value.values():
            _warn_value(v, analyzer, found)
    elif isinstance(value, list):
        for item in value:
            _warn_value(item, analyzer, found)


def warn_payload(payload: dict[str, Any]) -> list[str]:
    analyzer = _build_analyzer()
    found: list[str] = []

    _warn_value(payload, analyzer, found)

    return list(dict.fromkeys(found))


def _download_and_validate_wheel() -> None:
    if CACHED_WHEEL.exists():
        print("Validating cached wheel...", file=sys.stderr)
        with open(CACHED_WHEEL, "rb") as f:
            wheel_data = f.read()
    else:
        print("Downloading spacy wheel...", file=sys.stderr)

        try:
            with urllib.request.urlopen(SPACY_WHEEL_URL) as response:
                wheel_data = response.read()
        except Exception as e:
            print(f"ERROR: Failed to download wheel: {e}", file=sys.stderr)
            sys.exit(1)

        CACHE_DIR.mkdir(parents=True, exist_ok=True)

        with open(CACHED_WHEEL, "wb") as f:
            f.write(wheel_data)

        print(f"Cached to {CACHED_WHEEL}", file=sys.stderr)

    computed_sha256 = hashlib.sha256(wheel_data).hexdigest()

    if computed_sha256 != SPACY_WHEEL_SHA256:
        print(
            f"ERROR: SHA256 mismatch!\n"
            f"  Expected: {SPACY_WHEEL_SHA256}\n"
            f"  Got:      {computed_sha256}",
            file=sys.stderr,
        )
        sys.exit(1)

    print("Wheel integrity verified.", file=sys.stderr)

    extract_dir = CACHE_DIR / "en_core_web_sm-3.8.0"
    if not extract_dir.exists():
        print("Extracting spaCy model...", file=sys.stderr)
        with zipfile.ZipFile(CACHED_WHEEL) as zf:
            zf.extractall(extract_dir)
        print(f"Extracted to {extract_dir}", file=sys.stderr)

    if str(extract_dir) not in sys.path:
        sys.path.insert(0, str(extract_dir))


def _load_model_internal() -> None:
    print("Warming up presidio engines...", file=sys.stderr)

    _download_and_validate_wheel()
    _build_analyzer()
    _build_anonymizer()

    print("Done.", file=sys.stderr)


# Tools that write content to disk. Redacting their inputs would corrupt the
# files being written; the content is already in Claude's context before the
# tool is called, so intercepting it here adds no protection.
# "create"/"edit" are Copilot CLI's equivalents of Claude's Write/Edit/NotebookEdit
# (see the hooks reference's Claude-tool-name mapping).
_WRITE_TOOLS: frozenset[str] = frozenset({"Write", "Edit", "NotebookEdit", "create", "edit"})


def _normalize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Normalize Copilot CLI's camelCase hook payload ("toolName", "toolArgs",
    "toolResult") to Claude Code's shape ("tool_name", "tool_input",
    "tool_response") so the rest of the script only has to deal with one
    contract. Claude Code payloads pass through unchanged.
    """
    if "toolResult" in payload:
        return {**payload, "tool_response": payload["toolResult"], "_copilot": True}
    if "toolArgs" in payload:
        return {
            **payload,
            "tool_name": payload.get("toolName"),
            "tool_input": payload["toolArgs"],
            "_copilot": True,
        }
    return payload


def _detect_event(payload: dict[str, Any]) -> str | None:
    if "prompt" in payload and "tool_input" not in payload:
        return "UserPromptSubmit"
    if "tool_response" in payload:
        return "PostToolUse"
    if "tool_input" in payload and payload.get("tool_name") not in _WRITE_TOOLS:
        return "PreToolUse"
    return None


def _handle_user_prompt_submit(
    payload: dict[str, Any],
    analyzer: presidio_analyzer.AnalyzerEngine,
    anonymizer: presidio_anonymizer.AnonymizerEngine,
) -> dict[str, Any] | None:
    """Handle UserPromptSubmit event. Block prompt if PII detected."""
    prompt = payload.get("prompt", "")
    redacted = _redact_text(prompt, analyzer, anonymizer)
    if redacted != prompt:
        return {
            "decision": "block",
            "reason": (
                "Prompt contains personal information (PII). "
                "Please rephrase without including names, email addresses, "
                "NI numbers, NHS numbers, phone numbers, postcodes, "
                "or other personal data."
            ),
        }
    return None


def _handle_pre_tool_use(
    payload: dict[str, Any],
    analyzer: presidio_analyzer.AnalyzerEngine,
    anonymizer: presidio_anonymizer.AnonymizerEngine,
) -> dict[str, Any] | None:
    """Handle PreToolUse event. Redact tool input if PII detected."""
    tool_input = payload.get("tool_input", {})
    redacted_input = _redact_value(tool_input, analyzer, anonymizer)
    if redacted_input == tool_input:
        return None
    if payload.get("_copilot"):
        return {"modifiedArgs": redacted_input}
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow",
            "updatedInput": redacted_input,
        }
    }


def _handle_post_tool_use(
    payload: dict[str, Any],
    analyzer: presidio_analyzer.AnalyzerEngine,
    anonymizer: presidio_anonymizer.AnonymizerEngine,
) -> dict[str, Any] | None:
    """Handle PostToolUse event. Redact tool output if PII detected."""
    tool_response = payload.get("tool_response", {})
    redacted_response = _redact_value(tool_response, analyzer, anonymizer)
    if redacted_response == tool_response:
        return None
    if payload.get("_copilot"):
        return {"modifiedResult": redacted_response}
    return {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "updatedToolOutput": redacted_response,
        }
    }


@click.group(invoke_without_command=True)
@click.pass_context
def cli(ctx: click.Context) -> None:
    """PII redaction hook for Claude Code / GitHub Copilot."""
    if ctx.invoked_subcommand is None:
        redact_command()


@cli.command()
def preload() -> None:
    """Download spaCy model and warm up engines, then exit."""
    _load_model_internal()
    sys.stdout.write("Preload complete.\n")


@cli.command()
def warn() -> None:
    """Check for PII in stdin payload and warn (pass-through mode)."""
    _load_model_internal()

    raw = sys.stdin.read()

    try:
        payload: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError:
        sys.stdout.write(raw)
        sys.exit(0)

    try:
        found = warn_payload(payload)
        if found:
            types = ", ".join(found)
            sys.stderr.write(
                f"pii-warn: possible PII detected ({types})."
                " Review and redact before logging or persisting."
                " See skill defra-security-pii.\n"
            )
    except Exception as e:
        sys.stderr.write(f"ERROR: PII warning check failed: {e}\n")

    sys.stdout.write(raw)


@cli.command()
def redact_command() -> None:
    """Process stdin payload and redact PII (default mode)."""
    _load_model_internal()

    raw = sys.stdin.read()

    try:
        payload: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError:
        sys.stdout.write(raw)
        sys.exit(0)

    payload = _normalize_payload(payload)

    event = _detect_event(payload)
    if event is None:
        sys.exit(0)

    handlers = {
        "UserPromptSubmit": _handle_user_prompt_submit,
        "PreToolUse": _handle_pre_tool_use,
        "PostToolUse": _handle_post_tool_use,
    }

    try:
        analyzer = _build_analyzer()
        anonymizer = _build_anonymizer()

        handler = handlers.get(event)
        if handler:
            output = handler(payload, analyzer, anonymizer)
            if output:
                sys.stdout.write(json.dumps(output))

    except Exception as e:
        sys.stderr.write(f"ERROR: Redaction failed: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    cli()
