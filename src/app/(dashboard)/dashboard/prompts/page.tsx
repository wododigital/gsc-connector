import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PromptLibraryClient } from "@/components/prompt-library-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Library - OMG Bridge",
};

export default async function PromptsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return <PromptLibraryClient />;
}
