#!/bin/bash

# Quick push script for CS-HELPER to GitHub
# Repository: https://github.com/mahmoud78zalat/CS-HELPER

echo "🚀 Quick push to GitHub..."

# Remove existing origin if it exists
git remote remove origin 2>/dev/null || true

# Add GitHub repository
git remote add origin https://github.com/mahmoud78zalat/CS-HELPER.git

# Add, commit, and push
git add .
git commit -m "CS-HELPER project update - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push -u origin main --force

echo "✅ Done! Check: https://github.com/mahmoud78zalat/CS-HELPER"