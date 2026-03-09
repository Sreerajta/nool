#!/bin/bash
# Extract facts from a Wikipedia article.
# Requires: html2text (brew install html2text / apt install html2text)

curl -s "https://en.wikipedia.org/wiki/Octopus" \
  | html2text \
  | npx nool \
  | jq '.facts[] | .text'
