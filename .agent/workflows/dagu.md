---
description: Deploy to Firebase and update GitHub repository (DAGU)
---

1. Stage all changes, commit with a descriptive message about recent changes, and push to GitHub.
   - Command: `git add . && git commit -m "chore: updates and fixes" && git push` (Adjust commit message as needed)

// turbo
2. Build the project and deploy to Firebase Hosting.
   - Command: `npm run build && firebase deploy`
