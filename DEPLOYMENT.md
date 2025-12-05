# How to Update Your Live Website

Your website is hosted on **Firebase Hosting**.

**Live Link:** [https://infiniteyatra-iy.web.app/](https://infiniteyatra-iy.web.app/)

## The 2-Step Process

Since we have set up a shortcut script, you can deploy your latest changes with a single command.

1.  **Open Terminal**: Open your terminal in VS Code (Ctrl + `).
2.  **Run Deploy Command**:
    ```bash
    npm run deploy
    ```

## What happens next?
1.  The script will automatically **build** your project (convert React code to production-ready HTML/JS).
2.  It will **upload** the `dist` folder to Firebase.
3.  Your changes will go live immediately at the link above.

---

### Manual Deployment (If needed)
If the script doesn't work, you can run the commands manually:

```bash
npm run build
npx firebase deploy
```
