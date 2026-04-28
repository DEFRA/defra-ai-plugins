# Eval harness for Defra AI plugins
# Run 'make evals' to execute the suite against Copilot CLI.

.PHONY: evals evals-claude evals-view fixture-install fixture-test fixture-lint clean

RESULTS_DIR := results/run-$(shell date +%Y-%m-%d)
EVAL_DIR := plugins/frontend-developer/evals
FIXTURE_DIR := eval-fixture/hapi-frontend

# Install eval-fixture dependencies (the provider script copies the fixture
# into a temp dir, so node_modules must exist in the source).
fixture-install:
	cd $(FIXTURE_DIR) && npm install

fixture-test:
	cd $(FIXTURE_DIR) && npm test

fixture-lint:
	cd $(FIXTURE_DIR) && npm run lint

# Run the eval suite against Copilot CLI. Requires:
#   - Copilot CLI installed (`npm install -g @github/copilot`)
#   - The frontend-developer plugin installed (see README §Evaluating)
evals: fixture-install
	mkdir -p $(RESULTS_DIR)
	cd $(EVAL_DIR) && npx promptfoo eval --no-cache \
	  --filter-providers copilot-cli-frontend-developer
	cp $(EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results.json
	./$(EVAL_DIR)/check-regression.sh $(RESULTS_DIR)/promptfoo-results.json
	@echo ""
	@echo "Results saved to $(RESULTS_DIR)/promptfoo-results.json"
	@echo "View with: make evals-view"

# Same as `evals` but drives Claude Code instead of Copilot CLI. Requires:
#   - Claude Code installed (`npm install -g @anthropic-ai/claude-code`)
#   - ANTHROPIC_API_KEY set in the environment
#   - The frontend-developer plugin installed for Claude Code
evals-claude: fixture-install
	mkdir -p $(RESULTS_DIR)
	cd $(EVAL_DIR) && npx promptfoo eval --no-cache \
	  --filter-providers claude-code-frontend-developer
	cp $(EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results-claude.json
	./$(EVAL_DIR)/check-regression.sh $(RESULTS_DIR)/promptfoo-results-claude.json
	@echo ""
	@echo "Results saved to $(RESULTS_DIR)/promptfoo-results-claude.json"

evals-view:
	cd $(EVAL_DIR) && npx promptfoo view

clean:
	rm -rf $(EVAL_DIR)/output.json
	rm -rf $(EVAL_DIR)/.promptfoo
