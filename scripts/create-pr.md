# PR Workflow (Manual)

Step-by-step guide to stage changes, craft a branch name, push, and open a pull request using the GitHub CLI.

> **Prerequisites:** `gh` is installed and authenticated (`gh auth status` succeeds).

## 1. Stage changes

```bash
git status -sb
git add <files>        # or `git add -A` if you want everything
git diff --cached      # double-check the staged diff
```

## 2. Create a branch

Pick a slug from the main change (`feature`, `bugfix`, `docs`, etc.). Example:

```bash
slug="docs-prd-update"
branch="auto/${slug}-$(date +%Y%m%d%H%M%S)"
git checkout -b "$branch"
```

## 3. Commit with a clear message

```bash
git commit -m "docs: update PRD tasks"
```

## 4. Push to `origin`

```bash
git push -u origin "$branch"
```

If a pre-push hook fails (e.g., linting), fix the reported issues, amend, and push again:

```bash
# fix files
git add <fixed files>
git commit --amend --no-edit
git push -f
```

## 5. Open the PR against `origin/main`

```bash
gh pr create \
  --base main \
  --head "$branch" \
  --title "docs: update PRD tasks" \
  --body "## Summary
- Document changes here

## Testing
- [ ] Not run"
```

Escape backticks in the body by prefixing with a backslash (`\``) if you include command snippets.

## 6. Track next steps

- Wait for CI/previews to complete.
- Request reviews or merge once checks pass.
