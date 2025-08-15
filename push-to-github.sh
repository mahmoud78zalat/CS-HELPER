#!/bin/bash

# Shell script to push CS-HELPER project to GitHub
# Repository: https://github.com/mahmoud78zalat/CS-HELPER

set -e  # Exit on any error

echo "🚀 Starting GitHub push process for CS-HELPER..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    print_success "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Check if the remote already exists
if git remote | grep -q "origin"; then
    print_warning "Remote 'origin' already exists. Removing and re-adding..."
    git remote remove origin
fi

# Add the GitHub repository as remote origin
print_status "Adding GitHub remote repository..."
git remote add origin https://github.com/mahmoud78zalat/CS-HELPER.git
print_success "Remote repository added: https://github.com/mahmoud78zalat/CS-HELPER.git"

# Configure git user (if not already configured)
if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
    print_warning "Git user not configured. Please enter your details:"
    read -p "Enter your name: " git_user_name
    read -p "Enter your email: " git_user_email
    
    git config user.name "$git_user_name"
    git config user.email "$git_user_email"
    print_success "Git user configured: $git_user_name <$git_user_email>"
fi

# Add all files to staging
print_status "Adding all files to staging area..."
git add .
print_success "All files added to staging area"

# Check if there are any changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    # Commit the changes
    print_status "Committing changes..."
    
    # Generate a commit message with timestamp
    COMMIT_MESSAGE="Initial commit: CS-HELPER project - $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Allow user to customize commit message
    echo -e "${YELLOW}Default commit message:${NC} $COMMIT_MESSAGE"
    read -p "Press Enter to use default message, or type a custom message: " custom_message
    
    if [ ! -z "$custom_message" ]; then
        COMMIT_MESSAGE="$custom_message"
    fi
    
    git commit -m "$COMMIT_MESSAGE"
    print_success "Changes committed with message: $COMMIT_MESSAGE"
fi

# Check current branch
current_branch=$(git branch --show-current)
if [ -z "$current_branch" ]; then
    current_branch="main"
    git checkout -b main
    print_status "Created and switched to 'main' branch"
fi

# Push to GitHub
print_status "Pushing to GitHub repository..."
print_warning "You may be prompted to enter your GitHub credentials"

# Try to push, handling the case where the remote repository might not exist or be empty
if git push -u origin $current_branch 2>/dev/null; then
    print_success "Successfully pushed to GitHub!"
else
    print_warning "Initial push failed. Trying with --force flag (this will overwrite remote if it exists)..."
    if git push -u origin $current_branch --force; then
        print_success "Successfully force-pushed to GitHub!"
    else
        print_error "Failed to push to GitHub. Please check:"
        echo "  1. Your GitHub credentials"
        echo "  2. Repository exists: https://github.com/mahmoud78zalat/CS-HELPER"
        echo "  3. You have write access to the repository"
        echo "  4. Your internet connection"
        exit 1
    fi
fi

# Display repository information
echo ""
print_success "🎉 Project successfully pushed to GitHub!"
echo -e "${GREEN}Repository URL:${NC} https://github.com/mahmoud78zalat/CS-HELPER"
echo -e "${GREEN}Branch:${NC} $current_branch"
echo ""
print_status "Next steps:"
echo "  1. Visit: https://github.com/mahmoud78zalat/CS-HELPER"
echo "  2. Verify your code is there"
echo "  3. Set up any additional repository settings (description, topics, etc.)"
echo "  4. Configure branch protection rules if needed"
echo ""
print_success "Done! 🚀"