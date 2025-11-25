#!/bin/bash
# Post-tool-use hook for context bundle logging
# This hook creates append-only session logs for subagent work

# Configuration
BUNDLE_DIR=".claude/agents/context_bundles"
SESSION_ID="${CLAUDE_SESSION_ID:-$(uuidgen | tr '[:upper:]' '[:lower:]')}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AGENT_TYPE="${CLAUDE_AGENT_TYPE:-unknown}"

# Create bundle directory if it doesn't exist
mkdir -p "$BUNDLE_DIR"

# Log file path
LOG_FILE="${BUNDLE_DIR}/${AGENT_TYPE}_${SESSION_ID}_${TIMESTAMP//:/}.md"

# Function to append to log
log_entry() {
    local tool_name="$1"
    local tool_result="$2"

    # Create or append to log file
    if [ ! -f "$LOG_FILE" ]; then
        cat > "$LOG_FILE" << EOF
# Session Log: ${AGENT_TYPE}
Session ID: ${SESSION_ID}
Started: ${TIMESTAMP}

## Tools Used

EOF
    fi

    # Append tool usage
    cat >> "$LOG_FILE" << EOF
### ${tool_name}
\`\`\`
${tool_result}
\`\`\`

EOF
}

# Parse input from Claude Code hooks system
# Note: Actual implementation depends on Claude Code hooks API
# This is a template that should be adapted based on:
# - Hook event type (PreToolUse, PostToolUse, etc.)
# - Available environment variables
# - Input format from Claude Code

# Example usage (adapt to actual hooks API):
# TOOL_NAME=$(echo "$CLAUDE_HOOK_INPUT" | jq -r '.tool_name')
# TOOL_RESULT=$(echo "$CLAUDE_HOOK_INPUT" | jq -r '.result')
# log_entry "$TOOL_NAME" "$TOOL_RESULT"

echo "Context bundle hook loaded for session: $SESSION_ID"
