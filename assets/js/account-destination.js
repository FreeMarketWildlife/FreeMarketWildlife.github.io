// The server chooses the primary workspace. Browser routing never grants access.
export function primaryWorkspacePath(account) {
  const primary=account?.primaryWorkspace;
  if(!account?.user || !primary || typeof primary.id!=='string' || !primary.id || !Array.isArray(account.workspaces))return null;
  const matches=account.workspaces.filter(workspace=>workspace?.id===primary.id);
  if(matches.length!==1 || matches[0].path!==primary.path || typeof primary.path!=='string')return null;
  // Only plain root-relative page paths; no authority, query, encoding or traversal.
  if(!/^\/(?:[a-z0-9-]+\/)+$/.test(primary.path))return null;
  return primary.path;
}
