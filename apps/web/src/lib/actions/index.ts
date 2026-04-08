"use server"

import { db } from "@/db"
import { workspace, workspaceMember } from "@/db/schema/workspace"
import { drawing } from "@/db/schema/drawing"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { eq, and, or, desc, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) throw new Error("Unauthorized")
  return session
}

// ─── Workspace Actions ───

export async function getWorkspaces() {
  const session = await getSession()

  const ownedWorkspaces = await db
    .select()
    .from(workspace)
    .where(eq(workspace.ownerId, session.user.id))
    .orderBy(desc(workspace.updatedAt))

  const memberWorkspaces = await db
    .select({ workspace })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
    .where(
      and(
        eq(workspaceMember.userId, session.user.id),
        // Exclude workspaces the user owns (already in ownedWorkspaces)
      ),
    )
    .orderBy(desc(workspace.updatedAt))

  const memberWs = memberWorkspaces
    .map((r) => r.workspace)
    .filter((w) => w.ownerId !== session.user.id)

  return { owned: ownedWorkspaces, shared: memberWs }
}

export async function createWorkspace(name: string) {
  const session = await getSession()
  const id = nanoid()

  await db.insert(workspace).values({
    id,
    name,
    ownerId: session.user.id,
  })

  // Add owner as a member
  await db.insert(workspaceMember).values({
    id: nanoid(),
    workspaceId: id,
    userId: session.user.id,
    role: "owner",
  })

  revalidatePath("/")
  return { id }
}

export async function renameWorkspace(workspaceId: string, name: string) {
  const session = await getSession()

  await db
    .update(workspace)
    .set({ name, updatedAt: new Date() })
    .where(
      and(
        eq(workspace.id, workspaceId),
        eq(workspace.ownerId, session.user.id),
      ),
    )

  revalidatePath("/")
}

export async function deleteWorkspace(workspaceId: string) {
  const session = await getSession()

  await db
    .delete(workspace)
    .where(
      and(
        eq(workspace.id, workspaceId),
        eq(workspace.ownerId, session.user.id),
      ),
    )

  revalidatePath("/")
}

// ─── Drawing Actions ───

export async function getDrawings(workspaceId: string) {
  const session = await getSession()

  // Verify user has access to workspace
  const access = await db
    .select()
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, session.user.id),
      ),
    )
    .limit(1)

  if (access.length === 0) {
    // Also check if owner
    const ws = await db
      .select()
      .from(workspace)
      .where(
        and(
          eq(workspace.id, workspaceId),
          eq(workspace.ownerId, session.user.id),
        ),
      )
      .limit(1)

    if (ws.length === 0) throw new Error("Unauthorized")
  }

  return db
    .select()
    .from(drawing)
    .where(and(eq(drawing.workspaceId, workspaceId), isNull(drawing.deletedAt)))
    .orderBy(desc(drawing.updatedAt))
}

export async function createDrawing(workspaceId: string, title?: string) {
  const session = await getSession()
  const id = nanoid()

  await db.insert(drawing).values({
    id,
    title: title || "Untitled",
    workspaceId,
    createdById: session.user.id,
    sceneData: {
      elements: [],
      appState: { viewBackgroundColor: "#ffffff" },
      files: {},
    },
  })

  revalidatePath(`/workspace/${workspaceId}`)
  return { id }
}

export async function renameDrawing(drawingId: string, title: string) {
  await getSession()

  await db
    .update(drawing)
    .set({ title, updatedAt: new Date() })
    .where(eq(drawing.id, drawingId))

  revalidatePath("/")
}

export async function deleteDrawing(drawingId: string) {
  await getSession()

  // Soft delete
  await db
    .update(drawing)
    .set({ deletedAt: new Date() })
    .where(eq(drawing.id, drawingId))

  revalidatePath("/")
}

export async function getDrawing(drawingId: string) {
  const session = await getSession()

  const result = await db
    .select()
    .from(drawing)
    .where(eq(drawing.id, drawingId))
    .limit(1)

  if (result.length === 0) throw new Error("Drawing not found")

  const d = result[0]

  // Verify user has access to the workspace
  const access = await db
    .select()
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, d.workspaceId),
        eq(workspaceMember.userId, session.user.id),
      ),
    )
    .limit(1)

  if (access.length === 0) {
    const ws = await db
      .select()
      .from(workspace)
      .where(
        and(
          eq(workspace.id, d.workspaceId),
          eq(workspace.ownerId, session.user.id),
        ),
      )
      .limit(1)

    if (ws.length === 0) throw new Error("Unauthorized")
  }

  return d
}

export async function saveDrawing(
  drawingId: string,
  sceneData: unknown,
  sceneVersion: number,
) {
  await getSession()

  await db
    .update(drawing)
    .set({
      sceneData: sceneData as Record<string, unknown>,
      sceneVersion,
      updatedAt: new Date(),
    })
    .where(eq(drawing.id, drawingId))
}

export async function getWorkspace(workspaceId: string) {
  const session = await getSession()

  const result = await db
    .select()
    .from(workspace)
    .where(eq(workspace.id, workspaceId))
    .limit(1)

  if (result.length === 0) throw new Error("Workspace not found")

  const ws = result[0]

  // Verify access
  if (ws.ownerId !== session.user.id) {
    const access = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id),
        ),
      )
      .limit(1)

    if (access.length === 0) throw new Error("Unauthorized")
  }

  return ws
}
