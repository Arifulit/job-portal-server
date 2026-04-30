import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { env } from "./env";
import { findOrCreateGoogleUser } from "../modules/auth/services/authService";
import { User } from "../modules/auth/models/User";

const hasGoogleOAuthConfig = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
);

passport.serializeUser((user: any, done) => {
  done(null, user._id ?? user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select("+password");
    done(null, user as any);
  } catch (err) {
    done(err as any);
  }
});

if (hasGoogleOAuthConfig) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: env.GOOGLE_CALLBACK_URL as string,
        scope: ["email", "profile"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          const email = profile.emails?.[0]?.value?.trim().toLowerCase();
          if (!email) return done(new Error("Google account email is required"));

          const name = profile.displayName?.trim() || email.split("@")[0];
          const avatar = profile.photos?.[0]?.value?.trim() || "";
          const googleId = profile.id?.trim();
          if (!googleId) return done(new Error("Google account ID is required"));

          const user = await findOrCreateGoogleUser({
            googleId,
            email,
            name,
            avatar,
          });

          return done(null, user as any);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
} else {
  console.warn(
    "Google OAuth is disabled. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL to enable it.",
  );
}

export default passport;
