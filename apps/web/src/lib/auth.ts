import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { oneTimeToken } from "better-auth/plugins/one-time-token"
import { db } from "@/db"
import * as authSchema from "@/db/schema/auth"
import nodemailer from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"

const transporter = nodemailer.createTransport({
  host: process.env.WEB_SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.WEB_SMTP_USERNAME,
    pass: process.env.WEB_SMTP_PASSWORD,
  },
} as SMTPTransport.Options)

export const auth = betterAuth({
  secret: process.env.WEB_AUTH_SECRET,
  baseURL: process.env.WEB_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...authSchema,
    },
  }),
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        await transporter.sendMail({
          from: process.env.WEB_SMTP_MAIL_FROM,
          to: email,
          subject: "Sign in to Draw",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #111;">Sign in to Draw</h2>
              <p>Click the button below to sign in. This link expires in 10 minutes.</p>
              <a href="${url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                Sign in
              </a>
              <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">Or copy this link: ${url}</p>
            </div>
          `,
        })
      },
    }),
    oneTimeToken(),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh after 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min cache
    },
  },
})

export type Session = typeof auth.$Infer.Session
