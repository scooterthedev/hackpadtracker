# Hackpad-Progress-Tracker

This is a PR tracker for Hack Club's YSWS Hackpad. This project has been a major collaboration between [@scooterthedev](https://github.com/scooterthedev) and [@0CODERKID](https://github.com/0CODERKID). As of now, this project is being hosted on vercel, so it will be a little bit difficult to run locally, but we are hoping to make it easier to host locally in the future!

## How to Test/Run "Locally" For Testing:

1. Clone the repository - `git clone https://github.com/scooterthedev/hackpadtracker.git`

2. Run `npm install` to install all the necessary dependencies.

3. Go to vercel, and link up your repository to a new vercel project. Make sure under *Framework Preset* to set it to *Vite*, or else the deployment will fail.

4. Create a new slack bot for auth at https://api.slack.com/apps under the Hack Club workspace.

5. Under *OAuth & Permissions*, set your *Redirect URLs* to the url given to you from vercel.

   - If for example your url is https://hackpadtracker-eta.vercel.app, you should make your *Redirect URLs* look like:
     - https://hackpadtracker-eta.vercel.app
     - https://hackpadtracker-eta.vercel.app/callback

6. Under *Scopes*, set the necessary permissions for the bot to get. As of right now, all the bot needs is *users.profile:read*

7. Save all the settings, and Install the bot to the Hack Club workspace via *Settings* -> *Install App*.

8. Go back to vercel, and head over to the *Storage tab*. This is where you will make and configure your database.

   1. Click on *Create Database*, and select *Supabase*.
   2. Select your closest region, and click *Continue*.
   3. Make your *Database Name*, **PR_Tracker**, and click *Create*.
   4. Make a note of the *NEXT_PUBLIC_SUPABASE_ANON_KEY*, and the *NEXT_PUBLIC_SUPABASE_URL*, and there values as these will be important for later.

9. Next you will have to configure the SQL database

   1. Head over to your database, and click on *Open in Supabase*.

   2. Then head over the *SQL Editor* on the left hand bar.

   3. Paste this command in to the editor and click *Run* create the database properly:

      `CREATE TABLE pr_progress (`

        `id SERIAL PRIMARY KEY,`

        `pr_url TEXT NOT NULL UNIQUE,`

        `progress INTEGER NOT NULL,`

        `current_stage TEXT NOT NULL`

      `);`

10. Now that you have created your database, head back over to vercel's *Settings* -> *Environment Variables*, to set multiple variables. This will be necessary to make sure everything works fine.

11. These are the necessary variables to set for the website to function properly

    1. *VITE_URL* - (This is the main url for the project. Used for callback, fetching profile info etc) - set it to the **vercel url** **with no end slash and with the https://** eg. https://hackpadtracker-eta.vercel.app
    2. *VITE_AUTHUSERS3*, *VITE_AUTHUSERS2*, *VITE_AUTHUSERS1* - (These are used for the authorized users allowed to login to be an admin) - **set it to be the slack profile names of the users allowed to be authed with each user being under a different var** ie. VITE_AUTHUSERS3 = Scooter Y, VITE_AUTHUSERS2 = CODER KID etc.
    3. *VITE_CODE* - (This is the secret token for your slack bot **DO NOT SHARE**) - set it to be the client secret found under your [slack bot](https://api.slack.com/apps) *Settings* -> *Basic Information*.
    4. *VITE_SUPABASE_ANON_KEY* - (This will be your supabase key) - set this to be the value from the *NEXT_PUBLIC_SUPABASE_ANON_KEY* that you took a note of earlier on.
    5. *VITE_SUPABASE_URL* - (This will be your supabase url) - set this to be the value from the *NEXT_PUBLIC_SUPABASE_URL* that you took a note of earlier on.
    6. *VITE_GITHUB_API_URL* - (This is your repo's url eg. https://api.github.com/repos/hackclub/hackpad/pulls) - set this to be the github api link for your repo eg. the link before just with your own repo name.
    7. *VITE_CLIENT_ID* - (This is the slack bot's client ID) - set this to be the client ID for the slack bot found under *Settings* -> *Basic Information* in the [slack bot](https://api.slack.com/apps) settings.

12. Save everything, and if your deployment has already been pushed do the steps below, and if not head over to step 13

    1. If your repo has already been deployed once while you were configuring everything, you will need to re-reploy it for vercel to realize the environmental variable changes: 

       To do that, you can:

       - Create a commit of something random like adding a space randomly to trigger a vercel deployment
       - Or, you can head over to *Deployments*, select the 3 dots next to your most recent deployment and click *Redeploy*. Make sure *Use existing Build Cache* is disabled and click on *Redeploy*. Once vercel finishes building, and deploying it, everything should work as intended!

       I highly recommend you do **step 1**, and doing step 2 can cause problems on vercel's auto-domain assignment system.

13. If you have configured the slack bot and vercel all correctly, you should be able to push my code with no changes up to your repo and watch vercel auto-deploy it, and everything should work out well! Now every time you push a commit to main, vercel will automatically deploy it for you! 

14. If anything goes wrong throughout this, feel free to reach to me [@scooterthedev](https://github.com/scooterthedev) or [@0CODERKID](https://github.com/0CODERKID) for help!



## Screenshots

![https://cloud-m09a2igh9-hack-club-bot.vercel.app/0image.png](https://cloud-m09a2igh9-hack-club-bot.vercel.app/0image.png)

![https://cloud-cbzt8rgxa-hack-club-bot.vercel.app/0image.png](https://cloud-cbzt8rgxa-hack-club-bot.vercel.app/0image.png)

![https://cloud-i74avf30h-hack-club-bot.vercel.app/0image.png](https://cloud-i74avf30h-hack-club-bot.vercel.app/0image.png)