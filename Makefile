# Variables
EXTENSION_NAME = purrspective
VERSION = $(shell grep '"version"' manifest.json | cut -d'"' -f4)
ZIP_NAME = $(EXTENSION_NAME)-$(VERSION).zip
BUILD_DIR = build

# Required files and directories
REQUIRED_FILES = \
	manifest.json \
	content.js \
	background.js \
	config.js \
	popup/popup.html \
	popup/popup.css \
	popup/popup.js \
	sidebar/sidebar.css \
	icons/icon16.png \
	icons/icon48.png \
	icons/icon128.png

# Main build target
.PHONY: build
build: clean check-files
	@echo "Building $(ZIP_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@zip -r $(BUILD_DIR)/$(ZIP_NAME) $(REQUIRED_FILES) \
		-x "*.DS_Store" \
		-x "*.git*" \
		-x "*.env*" \
		-x "*node_modules*" \
		-x "*.vscode*" \
		-x "*.idea*"
	@echo "✅ Build complete: $(BUILD_DIR)/$(ZIP_NAME)"

# Check if all required files exist
.PHONY: check-files
check-files:
	@echo "Checking required files..."
	@for file in $(REQUIRED_FILES); do \
		if [ ! -e $$file ]; then \
			echo "❌ Missing required file: $$file"; \
			exit 1; \
		fi \
	done
	@echo "✅ All required files present"

# Clean build directory
.PHONY: clean
clean:
	@echo "Cleaning build directory..."
	@rm -rf $(BUILD_DIR)
	@echo "✅ Clean complete"

# Development build with source maps
.PHONY: dev
dev: clean check-files
	@echo "Building development version..."
	@mkdir -p $(BUILD_DIR)
	@zip -r $(BUILD_DIR)/$(EXTENSION_NAME)-dev.zip . \
		-x "*.DS_Store" \
		-x "*.git*" \
		-x "*.env*" \
		-x "*node_modules*" \
		-x "*.vscode*" \
		-x "*.idea*" \
		-x "$(BUILD_DIR)/*"
	@echo "✅ Development build complete: $(BUILD_DIR)/$(EXTENSION_NAME)-dev.zip"

# Help target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build    - Create production zip for Chrome Web Store"
	@echo "  make dev      - Create development zip with all source files"
	@echo "  make clean    - Clean build directory"
	@echo "  make help     - Show this help message"

# Default target
.DEFAULT_GOAL := help 