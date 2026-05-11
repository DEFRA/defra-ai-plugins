# Eval harness for Defra AI plugins
# Targets are plugin-scoped (e.g. `frontend-evals`) so additional plugins
# can wire in their own harnesses without colliding.
# Run 'make frontend-evals' to execute the suite against Copilot CLI.

.PHONY: evals-setup frontend-evals frontend-evals-claude frontend-evals-view \
        frontend-fixture-install frontend-fixture-test frontend-fixture-lint \
        frontend-clean

RESULTS_DIR := results/run-$(shell date +%Y-%m-%d)
EVAL_DIR := plugins/frontend-developer/evals
FIXTURE_DIR := plugins/frontend-developer/eval-fixture

# Ensure promptfoo's better-sqlite3 native binding is built for the active
# Node version. Idempotent — a no-op once the binding file exists. Needed on
# Node 24, where better-sqlite3 12.x has no prebuilt binary yet and `npm
# install` may complete without compiling one from source.
evals-setup:
	npm run evals:setup

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
frontend-evals: frontend-fixture-install evals-setup
	mkdir -p $(RESULTS_DIR)
	cd $(EVAL_DIR) && npx --no-install promptfoo eval --no-cache \
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
frontend-evals-claude: frontend-fixture-install evals-setup
	mkdir -p $(RESULTS_DIR)
	cd $(EVAL_DIR) && npx --no-install promptfoo eval --no-cache \
	  --filter-providers claude-code-frontend-developer
	cp $(EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results-claude.json
	./$(EVAL_DIR)/check-regression.sh $(RESULTS_DIR)/promptfoo-results-claude.json
	@echo ""
	@echo "Results saved to $(RESULTS_DIR)/promptfoo-results-claude.json"

frontend-evals-view:
	cd $(EVAL_DIR) && npx --no-install promptfoo view

frontend-clean:
	rm -rf $(EVAL_DIR)/output.json
	rm -rf $(EVAL_DIR)/.promptfoo
