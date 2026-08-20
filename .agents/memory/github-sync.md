---
name: GitHub sync through the secure connection
description: Safe fallback for publishing local commits when the GitHub CLI remote lacks usable authentication.
---

# GitHub sync through the secure connection

When a normal Git push is rejected because the workspace has no usable GitHub
CLI authentication, use the Replit-managed GitHub connection to create the
commit and update the branch through the GitHub API.

**Why:** The connection injects OAuth credentials safely without exposing a
personal token in the workspace or chat. It can also preserve a remote update
made after the local work was prepared.

**How to apply:** Fetch and rebase first. Before writing, compare the fetched
base SHA against the live branch SHA and stop if it changed. After creating the
API commit, fetch the remote; if the local and remote tree hashes match, align
the local branch to the remote commit so it does not remain artificially
diverged.