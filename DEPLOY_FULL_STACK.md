# How to Deploy Your Full-Stack CineStream Application

This guide provides step-by-step instructions to deploy both your Node.js backend and your React frontend to live, publicly accessible URLs. We will use free-tier services that are perfect for projects like this.

**Architecture Overview:**
1.  **Backend (Node.js/Express):** This will be deployed as a "Web Service" on a platform called **Render**. It will connect to your MongoDB database and send emails for user verification.
2.  **Frontend (React):** This is a static site that will be deployed to **Vercel**. It will be configured to send API requests to your live backend on Render.

---

### Prerequisites

1.  **Node.js:** Ensure you have Node.js installed on your computer to run the `backend` locally if needed.
2.  **GitHub Account:** You need a free GitHub account.
3.  **Code Editor:** A code editor like VS Code.

---

## Part 1: Prepare and Push Your Project to GitHub

Both Render and Vercel deploy directly from a GitHub repository.

1.  **Create a GitHub Repository:**
    *   Go to [GitHub](https://github.com/new) and create a new, public repository. Name it something like `cinestream-fullstack`.
    *   Do **not** initialize it with a README or .gitignore.

2.  **Initialize Git in Your Project:**
    *   Open your terminal in the root directory of your project (the one containing `index.html` and the `backend/` folder).
    *   Run the following commands:
        ```bash
        git init
        git add .
        git commit -m "Initial commit of full-stack CineStream app"
        ```

3.  **Connect and Push to GitHub:**
    *   On your new GitHub repository page, copy the commands under "...or push an existing repository from the command line". It will look like this:
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/cinestream-fullstack.git
        git branch -M main
        git push -u origin main
        ```
    *   Run these commands in your terminal. Your code is now on GitHub!

---

## Part 2: Deploy the Backend to Render

Now, let's get your server live.

1.  **Sign Up for Render:**
    *   Go to [render.com](https://render.com) and sign up using your GitHub account.

2.  **Create a New Web Service:**
    *   From your Render dashboard, click **"New +"** and select **"Web Service"**.
    *   Connect your GitHub account and select your `cinestream-fullstack` repository.

3.  **Configure the Web Service:**
    *   **Name:** `cinestream-backend` (or a unique name of your choice).
    *   **Root Directory:** `backend` (This is VERY important. It tells Render your server code is in the `backend` subfolder).
    *   **Environment:** `Node`.
    *   **Region:** Choose one close to you.
    *   **Branch:** `main`.
    *   **Build Command:** `npm install`.
    *   **Start Command:** `npm start`.
    *   **Instance Type:** Select the **Free** tier.

4.  **Add Environment Variables:**
    *   Scroll down to the "Advanced" section and click **"Add Environment Variable"**. This is how you securely provide your database and email credentials.
    *   **Key:** `MONGODB_URI`
    *   **Value:** `mongodb+srv://hellking2:hellking2@cluster0.u3ibvlt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    *   **Key:** `EMAIL_USER`
    *   **Value:** `cinestream2006@gmail.com`
    *   **Key:** `EMAIL_PASS`
    *   **Value:** *Your 16-character Google App Password.* (See instructions below)

    > ### **CRITICAL STEP: Configure Email Credentials (EMAIL_PASS)**
    > The OTP signup system will **FAIL** if this is not configured correctly. You **cannot** use your regular Gmail password. You must generate a special 16-character **App Password**.
    >
    > **How to Generate Your App Password:**
    > 1.  Go to your Google Account settings: [myaccount.google.com](https://myaccount.google.com/).
    > 2.  Click on the **"Security"** tab.
    > 3.  **Enable 2-Step Verification:** Scroll to "How you sign in to Google" and ensure **2-Step Verification** is **ON**. This is mandatory for App Passwords.
    > 4.  **Create the App Password:** On the same Security page, click on **"App passwords"**. You might need to sign in again.
    >     *   For "Select app," choose **"Mail"**.
    >     *   For "Select device," choose **"Other (Custom name)"**.
    >     *   Enter a name like `CineStream Backend` and click **"GENERATE"**.
    > 5.  **Copy the Password:** Google will display a 16-character password in a yellow box. It will look something like this:
    >     `asdf tghd yyrr wqkl`
    > 6.  **Paste into Render:** Copy this 16-character password and paste it into the `EMAIL_PASS` value field in Render. **IMPORTANT: Paste it WITHOUT any spaces.** The correct value would be:
    >     `asdftghdyyrrwqkl`

5.  **Deploy!**
    *   Click the **"Create Web Service"** button at the bottom.
    *   Render will start building and deploying your backend. This might take a few minutes. You can watch the logs in the "Logs" tab.
    *   Once it's live, you will see a URL at the top of the page, like `https://cinestream-backend.onrender.com`.

6.  **Copy Your Backend URL:**
    *   Copy this URL. You will need it in the next part.

---

## Part 3: Configure and Deploy the Frontend to Vercel

Finally, let's connect the frontend to your live backend and deploy it.

1.  **Update the Frontend Code:**
    *   Open `constants.ts` in your code editor.
    *   Find the `DB_BASE_URL` line.
    *   **Replace the placeholder URL with your live Render URL.** Make sure to add `/api` at the end. It should look like this:
        ```typescript
        // file: constants.ts
        export const DB_BASE_URL = 'https://cinestream-backend.onrender.com/api'; // <-- PASTE YOUR URL HERE
        ```

2.  **Commit and Push the Change:**
    *   Save the `constants.ts` file. In your terminal, run:
        ```bash
        git add constants.ts
        git commit -m "feat: configure frontend for live backend API"
        git push
        ```

3.  **Sign Up for Vercel:**
    *   Go to [vercel.com](https://vercel.com) and sign up using your GitHub account.

4.  **Create a New Project:**
    *   From your Vercel dashboard, click **"Add New..." -> "Project"**.
    *   Import your `cinestream-fullstack` GitHub repository.

5.  **Configure the Project:**
    *   Vercel is excellent at auto-detection. It should recognize that you have a static site with no framework.
    *   **Root Directory:** It should default to the project root. This is correct. Leave it as is.
    *   The "Build and Output Settings" can be left at their default values.
    *   Click **"Deploy"**.

6.  **Your Site is Live!**
    *   Vercel will deploy your frontend in under a minute.
    *   Once complete, it will give you a public URL (e.g., `https://cinestream-fullstack.vercel.app`). Click it to see your live application.

---

## Part 4: Verify and Troubleshoot Your Deployment

After deploying both services, it's crucial to test that they're working together correctly, especially the email service.

1.  **Create Your Admin Account:**
    *   The admin account is special and doesn't require email verification.
    *   Go to your live Vercel URL.
    *   Click **"Log In"**.
    *   Username: `admin`
    *   Password: `devils2@2006`

2.  **Use the Email Diagnostics Tool:**
    *   Once logged in as admin, navigate to the **Admin Dashboard** (there will be a link in the sidebar).
    *   Click on the **"Diagnostics"** tab.
    *   Click the **"Send Test Email"** button.

3.  **Analyze the Result:**
    *   **If you see a `Success` message:** Your email is configured perfectly! The OTP signup process for new users will work.
    *   **If you see a `Failure` message:** The detailed error message will tell you exactly what's wrong. Here's how to fix common errors:
        *   **Error containing `Invalid login` or `Authentication failed`:** Your `EMAIL_PASS` App Password in Render is incorrect. Double-check that you copied the 16 characters exactly and **without any spaces**.
        *   **Error containing `Connection timeout` or `ETIMEDOUT`:** This is a network or security issue. It means Render's server couldn't reach Google.
            *   **Go check your `cinestream2006@gmail.com` inbox for a "Security Alert" email from Google.** You MUST approve this sign-in attempt. This is the most common cause of this error.
            *   Wait a few minutes and try the test again.
        *   **Other errors:** The error message should give you a clue. If you're stuck, use the message to search for a solution online.

Once the diagnostics tool reports success, your application is fully functional. You can log out and try the regular signup process to confirm.

---

### Congratulations!

You now have a fully deployed full-stack application.

*   Your **React frontend** is running on Vercel.
*   Your **Node.js backend** is running on Render.
*   Your **data** is being stored in your MongoDB Atlas database.

The frontend will make live API calls to the backend to log in users, save favorites, and fetch movie links.