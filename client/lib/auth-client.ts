import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:  "http://localhost:3001",

  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          input: false,     // signup pe user ye nahi bhej sakta
        },
      },
    }),
  ],
});

