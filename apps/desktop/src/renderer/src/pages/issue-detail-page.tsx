import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { IssueDetail } from "@multica/views/issues/components";
import { ErrorBoundary } from "@multica/ui/components/common/error-boundary";
import { useWorkspaceId } from "@multica/core/hooks";
import { issueDetailOptions } from "@multica/core/issues/queries";
import { useTabStore } from "@/stores/tab-store";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const wsId = useWorkspaceId();
  const { data: issue } = useQuery(issueDetailOptions(wsId, id!));

  useDocumentTitle(issue ? `${issue.identifier}: ${issue.title}` : "Issue");

  const handleDelete = useCallback(() => {
    const { activeWorkspaceSlug, byWorkspace, closeTab } = useTabStore.getState();
    if (!activeWorkspaceSlug) return;
    const group = byWorkspace[activeWorkspaceSlug];
    if (!group) return;
    closeTab(group.activeTabId);
  }, []);

  if (!id) return null;
  return (
    <ErrorBoundary resetKeys={[id]}>
      <IssueDetail issueId={id} onDelete={handleDelete} />
    </ErrorBoundary>
  );
}
