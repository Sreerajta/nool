#!/bin/bash
# Extract facts from a local text file (e.g., a research paper converted to plain text).
# Outputs the top 10 highest-confidence facts.

cat "${1:?Usage: ./research-paper.sh <file.txt>}" \
  | npx nool \
  | jq '[.facts | sort_by(-.confidence) | .[:10] | .[] | {text, confidence}]'
