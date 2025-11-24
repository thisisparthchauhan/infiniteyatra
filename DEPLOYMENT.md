# How to Update Your Live Website

Since your project is connected to Vercel and GitHub, updating your website is easy.

## The 3-Step Process

1.  **Make Changes**: Edit your code (e.g., change text, styles) and save the files.
2.  **Open Terminal**: Open your terminal in VS Code (Ctrl + `).
3.  **Push to GitHub**: Run these 3 commands in order:

```bash
git add .
git commit -m "Describe your change here"
git push
```

## What happens next?
- **GitHub** receives your code.
- **Vercel** automatically detects the new code.
- Vercel **builds and deploys** your site (takes ~1-2 minutes).
- Your changes go live at: https://infiniteyatra.vercel.app/
