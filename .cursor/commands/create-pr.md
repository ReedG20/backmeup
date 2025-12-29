# Open a PR

Intelligently create a PR based on current branch:
- Feature branch → targets `staging`
- `staging` branch → targets `main`
- `main` branch → bail and explain

Steps:
1. Determine target branch based on current branch
2. Check diff between current and target branch
3. If there's unstaged or staged work that hasn't been commited, 
commit all the relevant code first
4. Write up a quick PR description in the following format

<feature_area>: <Title> (80 characters or less)

<TLDR> (no more than 2 sentences)

<Description>
- 1~3 bullet points explaining what's changing


- Always paste the link to the PR in your response so I can click it easily
- Prepend GIT_EDITOR=true to all git commands you run, so you can avoid getting blocked as you execute commands
- If the CLI is constrained by the sandbox (sandboxed runner, missing network), run the same command outside the sandboxed environment so `gh pr create …` can succeed.