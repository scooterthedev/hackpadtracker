import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function sendEmail(to, prUrl, oldStage, newStage) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const prNumber = prUrl.split('/pull/').pop();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Hackpad Stage Update',
    text: `The Hackpad PR #${prNumber} has moved from ${oldStage} to ${newStage}!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
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
      const emailSent = await sendEmail(pr.email, pr.pr_url, pr.old_current_stage, pr.current_stage);
      if (emailSent) {
        const { error: updateError } = await supabase
          .from('pr_progress')
          .update({ old_current_stage: pr.current_stage })
          .eq('pr_url', pr.pr_url);
        if (updateError) {
          console.error('Error updating stage:', updateError);
        } else {
          console.log(`Stage updated for PR ${pr.pr_url}`);
        }
      }
    }
  }
}

checkForStageChanges();
