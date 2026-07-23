import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";

// Passwordless email sign-in: step 1 emails a 6-digit code, step 2 verifies
// it. Same UX as the old Supabase OTP flow, but with no magic-link/redirect
// step to misconfigure (SyncCard.tsx never relies on a URL round-trip).
export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // 15 minutes
  async generateVerificationToken() {
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  },
  async sendVerificationRequest({ identifier: email, token, provider }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Zenith <onboarding@resend.dev>",
      to: [email],
      subject: `Your Zenith code: ${token}`,
      text: `Your Zenith sign-in code is ${token}. It expires in 15 minutes.`,
    });
    if (error) {
      throw new Error(`Could not send sign-in email: ${JSON.stringify(error)}`);
    }
  },
});
