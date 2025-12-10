#!/bin/bash

# Git Remote Push Script
# Pushes local commits to the remote repository

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           Git Remote Push Script                       ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}✗ Not a git repository${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}Current branch:${NC} $CURRENT_BRANCH"
echo ""

# Check if branch has upstream
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ No upstream branch set${NC}"
    echo -e "${YELLOW}Will set upstream to: origin/$CURRENT_BRANCH${NC}"
    PUSH_CMD="git push -u origin $CURRENT_BRANCH"
else
    UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u})
    echo -e "${BLUE}Upstream branch:${NC} $UPSTREAM"
    PUSH_CMD="git push"
fi
echo ""

# Check for unpushed commits
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l | tr -d ' ')

if [ "$UNPUSHED" -eq 0 ]; then
    echo -e "${GREEN}✓ No unpushed commits${NC}"
    echo -e "${YELLOW}Branch is up to date with remote${NC}"
    exit 0
fi

# Show commits to be pushed
echo -e "${YELLOW}Commits to be pushed ($UNPUSHED):${NC}"
echo ""
git log @{u}.. --oneline --decorate
echo ""

# Show detailed info about commits
echo -e "${YELLOW}Detailed commit info:${NC}"
echo ""
git log @{u}.. --stat
echo ""

# Safety check for force push to main/master
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    if [[ "$1" == "--force" || "$1" == "-f" ]]; then
        echo -e "${RED}⚠ WARNING: Force push to $CURRENT_BRANCH is dangerous!${NC}"
        read -p "$(echo -e ${RED}Are you ABSOLUTELY sure? [y/N]: ${NC})" -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Push cancelled${NC}"
            exit 0
        fi
    fi
fi

# Check for diverged branches
if git status -sb | grep -q "diverged"; then
    echo -e "${RED}⚠ WARNING: Your branch has diverged from the remote!${NC}"
    echo -e "${YELLOW}You may need to pull and merge changes first:${NC}"
    echo -e "  git pull --rebase origin $CURRENT_BRANCH"
    echo ""
    read -p "$(echo -e ${YELLOW}Continue with push anyway? [y/N]: ${NC})" -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Push cancelled${NC}"
        exit 0
    fi
fi

# Final confirmation
read -p "$(echo -e ${YELLOW}Push $UNPUSHED commit(s) to remote? [y/N]: ${NC})" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Push cancelled${NC}"
    exit 0
fi

# Perform the push
echo ""
echo -e "${YELLOW}Pushing to remote...${NC}"
echo ""

if eval $PUSH_CMD; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Successfully pushed to remote${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""

    # Show final status
    echo -e "${BLUE}Final status:${NC}"
    git status -sb
    echo ""

    # Show remote URL
    REMOTE_URL=$(git remote get-url origin 2>/dev/null)
    if [ -n "$REMOTE_URL" ]; then
        echo -e "${BLUE}Remote URL:${NC} $REMOTE_URL"
    fi
    echo ""
else
    echo ""
    echo -e "${RED}✗ Push failed${NC}"
    echo -e "${YELLOW}Common solutions:${NC}"
    echo -e "  • Pull latest changes: git pull --rebase origin $CURRENT_BRANCH"
    echo -e "  • Check remote access/credentials"
    echo -e "  • Verify remote URL: git remote -v"
    echo ""
    exit 1
fi
