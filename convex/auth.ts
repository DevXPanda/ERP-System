import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      crypto: {
        async hashSecret(password: string) {
          const encoder = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password));
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        },
        async verifySecret(password: string, hash: string) {
          const encoder = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password));
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          return passwordHash === hash;
        },
      },
      validatePasswordRequirements(password) {
        if (!password || password.length < 4) {
          throw new Error("Password must be at least 4 characters");
        }
      },
      profile(params) {
        const profile: { email: string; name?: string; role?: string } = {
          email: params.email as string,
        };
        if (params.name !== undefined) {
          profile.name = params.name as string;
        }
        if (params.role !== undefined) {
          profile.role = params.role as string;
        }
        return profile;
      },
    }),
  ],
});
