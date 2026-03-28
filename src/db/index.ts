import { drizzle } from "drizzle-orm/node-postgres"
import * as authSchema from "./schema/auth"
import * as workspaceSchema from "./schema/workspace"
import * as drawingSchema from "./schema/drawing"

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...authSchema,
    ...workspaceSchema,
    ...drawingSchema,
  },
})
