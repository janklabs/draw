import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { user } from "./auth"
import { workspace } from "./workspace"

export const drawing = pgTable("drawing", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled"),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  // Scene data stored as JSON (elements + appState)
  // In the E2E encrypted version, this will be encrypted ciphertext
  sceneData: jsonb("scene_data"),
  sceneVersion: integer("scene_version").notNull().default(0),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
})

export const drawingFile = pgTable("drawing_file", {
  id: text("id").primaryKey(),
  drawingId: text("drawing_id")
    .notNull()
    .references(() => drawing.id, { onDelete: "cascade" }),
  fileHash: text("file_hash").notNull(),
  mimeType: text("mime_type").notNull(),
  // Store file data as base64 encoded text (for simplicity with small team)
  data: text("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const drawingVersion = pgTable("drawing_version", {
  id: text("id").primaryKey(),
  drawingId: text("drawing_id")
    .notNull()
    .references(() => drawing.id, { onDelete: "cascade" }),
  sceneVersion: integer("scene_version").notNull(),
  sceneData: jsonb("scene_data").notNull(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const shareLinkPermissionEnum = pgEnum("share_link_permission", [
  "view",
  "edit",
])

export const shareLink = pgTable("share_link", {
  id: text("id").primaryKey(),
  drawingId: text("drawing_id")
    .notNull()
    .references(() => drawing.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  permission: shareLinkPermissionEnum("permission").notNull().default("view"),
  expiresAt: timestamp("expires_at"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Relations
export const drawingRelations = relations(drawing, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [drawing.workspaceId],
    references: [workspace.id],
  }),
  createdBy: one(user, {
    fields: [drawing.createdById],
    references: [user.id],
  }),
  files: many(drawingFile),
  versions: many(drawingVersion),
  shareLinks: many(shareLink),
}))

export const drawingFileRelations = relations(drawingFile, ({ one }) => ({
  drawing: one(drawing, {
    fields: [drawingFile.drawingId],
    references: [drawing.id],
  }),
}))

export const drawingVersionRelations = relations(drawingVersion, ({ one }) => ({
  drawing: one(drawing, {
    fields: [drawingVersion.drawingId],
    references: [drawing.id],
  }),
  createdBy: one(user, {
    fields: [drawingVersion.createdById],
    references: [user.id],
  }),
}))

export const shareLinkRelations = relations(shareLink, ({ one }) => ({
  drawing: one(drawing, {
    fields: [shareLink.drawingId],
    references: [drawing.id],
  }),
  createdBy: one(user, {
    fields: [shareLink.createdById],
    references: [user.id],
  }),
}))
