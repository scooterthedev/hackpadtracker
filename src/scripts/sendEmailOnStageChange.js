const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

async function sendEmail(to, prUrl, oldStage, newStage) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.com',
    port: 465,
    secure: true,
    auth: {
      user: import.meta.env.VITE_EMAIL_USER,
      pass: import.meta.env.VITE_EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: import.meta.env.VITE_EMAIL_USER,
    to,
    subject: 'Hackpad Stage Update',
    text: `The Hackpad PR #${prUrl} has moved from ${oldStage} to ${newStage}! View live updates at https://hackpadtracker-eta.vercel.app!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function checkForStageChanges() {
  const { data, error } = await supabase
    .from('pr_progress')
    .select('pr_url, old_current_stage, current_stage, email')
    .neq('old_current_stage', null);

  if (error) {
    console.error('Error fetching stage changes:', error);
    return;
  }

  for (const pr of data) {
    if (pr.old_current_stage !== pr.current_stage && pr.email) {
      await sendEmail(pr.email, pr.pr_url, pr.old_current_stage, pr.current_stage);
    }
  }
}

checkForStageChanges();
