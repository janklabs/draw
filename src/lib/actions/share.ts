"use server"

import { db } from "@/db"
import { shareLink } from "@/db/schema/drawing"
import { drawing } from "@/db/schema/drawing"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { eq, and } from "drizzle-orm"

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) throw new Error("Unauthorized")
  return session
}

export async function createShareLink(
  drawingId: string,
  permission: "view" | "edit",
  expiresInDays?: number,
) {
  const session = await getSession()
  const id = nanoid()
  const token = nanoid(32)

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  await db.insert(shareLink).values({
    id,
    drawingId,
    token,
    permission,
    expiresAt,
    createdById: session.user.id,
  })

  return { token }
}

export async function getShareLinks(drawingId: string) {
  await getSession()

  return db.select().from(shareLink).where(eq(shareLink.drawingId, drawingId))
}

export async function deleteShareLink(linkId: string) {
  await getSession()
  await db.delete(shareLink).where(eq(shareLink.id, linkId))
}

export async function getDrawingByShareToken(token: string) {
  const result = await db
    .select()
    .from(shareLink)
    .where(eq(shareLink.token, token))
    .limit(1)

  if (result.length === 0) return null

  const link = result[0]

  // Check expiration
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return null
  }

  const drawingResult = await db
    .select()
    .from(drawing)
    .where(eq(drawing.id, link.drawingId))
    .limit(1)

  if (drawingResult.length === 0) return null

  return {
    drawing: drawingResult[0],
    permission: link.permission,
  }
}
