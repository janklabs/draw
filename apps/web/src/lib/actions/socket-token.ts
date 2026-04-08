"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function generateSocketToken() {
  const data = await auth.api.generateOneTimeToken({
    headers: await headers(),
  })

  return data.token
}
