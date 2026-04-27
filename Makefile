# Eval harness for Defra AI plugins
# Run 'make evals' to execute the suite against Copilot CLI.

.PHONY: evals evals-view fixture-install fixture-test fixture-lint clean

RESULTS_DIR := results/run-$(shell date +%Y-%m-%d)
EVAL_DIR := evals/promptfoo
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
	cd $(EVAL_DIR) && npx promptfoo eval --no-cache
	cp $(EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results.json
	@echo ""
	@echo "Results saved to $(RESULTS_DIR)/promptfoo-results.json"
	@echo "View with: make evals-view"

evals-view:
	cd $(EVAL_DIR) && npx promptfoo view

clean:
	rm -rf $(EVAL_DIR)/output.json
	rm -rf $(EVAL_DIR)/.promptfoo
