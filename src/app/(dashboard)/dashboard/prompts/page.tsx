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

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Prompt <span className="accent">library.</span></h1>
          <p className="lede">
            Reusable prompts ready to drop into any AI assistant. Run them on demand or schedule them.
          </p>
        </div>
      </div>
      <PromptLibraryClient />
    </>
  );
}
