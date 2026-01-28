import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: 'f6aab4af7534a0dedc2f233aeaa6ded71d58cc12', queries,  });
export default client;
  