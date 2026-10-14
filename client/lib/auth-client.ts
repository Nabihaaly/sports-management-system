import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:  "http://localhost:4380",

    user: {
    additionalFields: {
      role: {
        type: "string",
        default: "PLAYER"
      },
    },
  },
});

