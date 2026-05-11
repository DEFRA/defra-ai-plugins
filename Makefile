# Eval harness for Defra AI plugins
# Targets are plugin-scoped (e.g. `frontend-evals`) so additional plugins
# can wire in their own harnesses without colliding.
# Run 'make frontend-evals' to execute the suite against Copilot CLI.

.PHONY: frontend-evals frontend-evals-claude frontend-evals-view \
        frontend-fixture-install frontend-fixture-test frontend-fixture-lint \
        frontend-clean \
        code-reviewer-evals code-reviewer-evals-claude code-reviewer-evals-view \
        code-reviewer-clean

RESULTS_DIR := results/run-$(shell date +%Y-%m-%d)
EVAL_DIR := plugins/frontend-developer/evals
FIXTURE_DIR := plugins/frontend-developer/eval-fixture

# Install eval-fixture dependencies (the provider script copies the fixture
# into a temp dir, so node_modules must exist in the source).
frontend-fixture-install:
	cd $(FIXTURE_DIR) && npm install

frontend-fixture-test:
	cd $(FIXTURE_DIR) && npm test

frontend-fixture-lint:
	cd $(FIXTURE_DIR) && npm run lint

# Run the eval suite against Copilot CLI. Requires:
#   - Copilot CLI installed (`npm install -g @github/copilot`)
#   - The frontend-developer plugin installed (see README §Evaluating)
frontend-evals: frontend-fixture-install
	mkdir -p $(RESULTS_DIR)
	cd $(EVAL_DIR) && npx promptfoo eval --no-cache \
	  --filter-providers copilot-cli-frontend-developer
	cp $(EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results.json
	./$(EVAL_DIR)/check-regression.sh $(RESULTS_DIR)/promptfoo-results.json
	@echo ""
	@echo "Results saved to $(RESULTS_DIR)/promptfoo-results.json"
	@echo "View with: make frontend-evals-view"

# Same as `frontend-evals` but drives Claude Code instead of Copilot CLI. Requires:
#   - Claude Code installed (`npm install -g @anthropic-ai/claude-code`)
#   - ANTHROPIC_API_KEY set in the environment
#   - The frontend-developer plugin installed for Claude Code
frontend-evals-claude: frontend-fixture-install
	mkdir -p $(RESULTS_DIR)
	cd $(EVAL_DIR) && npx promptfoo eval --no-cache \
	  --filter-providers claude-code-frontend-developer
	cp $(EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results-claude.json
	./$(EVAL_DIR)/check-regression.sh $(RESULTS_DIR)/promptfoo-results-claude.json
	@echo ""
	@echo "Results saved to $(RESULTS_DIR)/promptfoo-results-claude.json"

frontend-evals-view:
	cd $(EVAL_DIR) && npx promptfoo view

frontend-clean:
	rm -rf $(EVAL_DIR)/output.json
	rm -rf $(EVAL_DIR)/.promptfoo

# --- code-reviewer plugin -------------------------------------------------

CR_EVAL_DIR := plugins/code-reviewer/evals

# Run the eval suite against Copilot CLI. Requires:
#   - Copilot CLI installed (`npm install -g @github/copilot`)
#   - The code-reviewer plugin installed (see plugins/code-reviewer/README.md)
# The eval fixture has no node_modules to install — provider scripts seed
# a git history inside a temp working copy at run time.
code-reviewer-evals:
	mkdir -p $(RESULTS_DIR)
	cd $(CR_EVAL_DIR) && npx promptfoo eval --no-cache \
	  --filter-providers copilot-cli-code-reviewer
	cp $(CR_EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results-code-reviewer.json
	./$(CR_EVAL_DIR)/check-regression.sh $(RESULTS_DIR)/promptfoo-results-code-reviewer.json
	@echo ""
	@echo "Results saved to $(RESULTS_DIR)/promptfoo-results-code-reviewer.json"
	@echo "View with: make code-reviewer-evals-view"

# Same as `code-reviewer-evals` but drives Claude Code. Requires:
#   - Claude Code installed (`npm install -g @anthropic-ai/claude-code`)
#   - ANTHROPIC_API_KEY set in the environment
#   - The code-reviewer plugin installed for Claude Code
code-reviewer-evals-claude:
	mkdir -p $(RESULTS_DIR)
	cd $(CR_EVAL_DIR) && npx promptfoo eval --no-cache \
	  --filter-providers claude-code-code-reviewer
	cp $(CR_EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results-code-reviewer-claude.json
	./$(CR_EVAL_DIR)/check-regression.sh $(RESULTS_DIR)/promptfoo-results-code-reviewer-claude.json
	@echo ""
	@echo "Results saved to $(RESULTS_DIR)/promptfoo-results-code-reviewer-claude.json"

code-reviewer-evals-view:
	cd $(CR_EVAL_DIR) && npx promptfoo view

code-reviewer-clean:
	rm -rf $(CR_EVAL_DIR)/output.json
	rm -rf $(CR_EVAL_DIR)/.promptfoo
