"use server"

import { db } from "@/db"
import { drawingVersion, drawing } from "@/db/schema/drawing"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { eq, desc } from "drizzle-orm"

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) throw new Error("Unauthorized")
  return session
}

export async function createVersion(drawingId: string) {
  const session = await getSession()

  // Get current drawing data
  const result = await db
    .select()
    .from(drawing)
    .where(eq(drawing.id, drawingId))
    .limit(1)

  if (result.length === 0) throw new Error("Drawing not found")

  const d = result[0]

  await db.insert(drawingVersion).values({
    id: nanoid(),
    drawingId,
    sceneVersion: d.sceneVersion,
    sceneData: d.sceneData || {},
    createdById: session.user.id,
  })
}

export async function getVersions(drawingId: string) {
  await getSession()

  return db
    .select()
    .from(drawingVersion)
    .where(eq(drawingVersion.drawingId, drawingId))
    .orderBy(desc(drawingVersion.createdAt))
    .limit(50)
}

export async function restoreVersion(versionId: string) {
  const session = await getSession()

  const result = await db
    .select()
    .from(drawingVersion)
    .where(eq(drawingVersion.id, versionId))
    .limit(1)

  if (result.length === 0) throw new Error("Version not found")

  const version = result[0]

  // Save current state as a version before restoring
  await createVersion(version.drawingId)

  // Restore the version data
  await db
    .update(drawing)
    .set({
      sceneData: version.sceneData as Record<string, unknown>,
      sceneVersion: version.sceneVersion,
      updatedAt: new Date(),
    })
    .where(eq(drawing.id, version.drawingId))

  return version.drawingId
}
