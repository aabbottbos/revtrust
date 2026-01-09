# Git Scripts Guide

Two convenient scripts for managing git commits and pushes.

## Scripts

### 1. `git_local.sh` - Local Commits

Commits all changes to your local repository.

**Usage:**
```bash
./git_local.sh
```

**What it does:**
1. ✅ Checks you're in a git repository
2. ✅ Shows current branch
3. ✅ Displays git status and diff
4. ✅ Prompts for confirmation
5. ✅ Asks for commit message (supports multi-line)
6. ✅ Stages all changes (`git add .`)
7. ✅ Creates commit with your message + Claude attribution
8. ✅ Shows commit details and branch status

**Example:**
```bash
$ ./git_local.sh

════════════════════════════════════════════════════════
           Git Local Commit Script
════════════════════════════════════════════════════════

Current branch: main

Git Status:
 M backend/app/main.py
 M frontend/package.json
?? new_file.py

Changes to be committed:
...

Review the changes above. Continue with commit? [y/N]: y

Enter commit message:
(Press Enter for multi-line, type 'END' on a new line when done)

Add new feature for user dashboard
- Updated backend routes
- Added frontend components
END

✓ Commit successful
```

### 2. `git_remote.sh` - Push to Remote

Pushes local commits to the remote repository.

**Usage:**
```bash
./git_remote.sh
```

**What it does:**
1. ✅ Checks you're in a git repository
2. ✅ Shows current branch and upstream
3. ✅ Lists unpushed commits
4. ✅ Shows detailed commit info
5. ✅ **Safety checks for main/master branch**
6. ✅ Warns if branch has diverged
7. ✅ Prompts for confirmation
8. ✅ Pushes to remote
9. ✅ Shows final status

**Example:**
```bash
$ ./git_remote.sh

════════════════════════════════════════════════════════
           Git Remote Push Script
════════════════════════════════════════════════════════

Current branch: main
Upstream branch: origin/main

Commits to be pushed (2):
abc1234 Add new feature for user dashboard
def5678 Fix authentication bug

Push 2 commit(s) to remote? [y/N]: y

✓ Successfully pushed to remote
```

## Workflow

### Standard Workflow
```bash
# 1. Make your changes to files
# ...

# 2. Commit locally
./git_local.sh
# Enter commit message when prompted

# 3. Push to remote
./git_remote.sh
# Confirm when prompted
```

### Quick Commit & Push
```bash
./git_local.sh && ./git_remote.sh
```

This runs both scripts in sequence (only pushes if commit succeeds).

## Safety Features

### `git_local.sh`
- Shows full diff before committing
- Requires confirmation
- Validates commit message is not empty
- Shows exactly what will be committed
- Adds Claude attribution automatically

### `git_remote.sh`
- **Prevents accidental force push to main/master** (without explicit flag)
- Warns if branch has diverged from remote
- Shows all commits that will be pushed
- Requires confirmation before pushing
- Provides helpful error messages

## Commit Message Format

The scripts automatically add attribution to your commits:

```
Your commit message here

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Multi-line Commit Messages

The local script supports multi-line messages:

```
Add new scheduled review feature

- Implemented scheduled review API endpoints
- Added frontend UI for managing schedules
- Integrated with APScheduler for job scheduling
- Added email and Slack delivery options

Closes #42
END
```

Type your message, then `END` on a new line when done.

## Advanced Usage

### Check Status Before Committing
```bash
git status
git diff
./git_local.sh
```

### Set Upstream on First Push
If you have a new branch, `git_remote.sh` will automatically set the upstream:
```bash
# Creates and pushes new branch
git checkout -b feature/new-feature
./git_local.sh
./git_remote.sh  # Automatically runs: git push -u origin feature/new-feature
```

### Handle Diverged Branches
If your branch has diverged:
```bash
# Pull and rebase first
git pull --rebase origin main

# Then push
./git_remote.sh
```

## Troubleshooting

### "Not a git repository"
Make sure you're in the project directory:
```bash
cd /path/to/revtrust
./git_local.sh
```

### "No changes to commit"
All changes are already committed. Check status:
```bash
git status
```

### "Push failed"
Common causes and fixes:

**1. Need to pull first:**
```bash
git pull --rebase origin main
./git_remote.sh
```

**2. No remote configured:**
```bash
git remote add origin <repository-url>
./git_remote.sh
```

**3. Authentication issues:**
- Check GitHub/GitLab credentials
- Verify SSH keys are configured
- Try HTTPS instead of SSH (or vice versa)

### "Branch has diverged"
Your local branch and remote have different commits:
```bash
# Option 1: Rebase (recommended)
git pull --rebase origin main

# Option 2: Merge
git pull origin main

# Then push
./git_remote.sh
```

## Integration with Other Scripts

These git scripts work alongside the other RevTrust scripts:

```bash
# Typical development workflow
./start_revtrust.sh     # Start all services
# ... make changes and test ...
./git_local.sh          # Commit changes
./git_remote.sh         # Push to remote
./stop_revtrust.sh      # Stop services
```

## Environment

These scripts work with:
- ✅ Any git repository
- ✅ Any branch name
- ✅ Multiple remotes
- ✅ Both SSH and HTTPS git URLs
- ✅ macOS, Linux (not tested on Windows)

## Notes

- Scripts use color-coded output for better readability
- All operations require confirmation (no accidental commits/pushes)
- Safe to use on main/master branches (extra warnings)
- Supports standard git workflows and hooks
- Won't skip pre-commit hooks or other git safeguards
