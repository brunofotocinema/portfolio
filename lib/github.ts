const GITHUB_API = "https://api.github.com";

export class GithubCommitError extends Error {}

function getConfig() {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    throw new GithubCommitError(
      "Configuração do GitHub ausente no servidor (GITHUB_REPO_OWNER, GITHUB_REPO_NAME ou GITHUB_TOKEN)."
    );
  }

  return { owner, repo, branch, token };
}

async function githubRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "site-bruno-homem-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GithubCommitError(
      `Erro na API do GitHub (${res.status}): ${body || res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

export interface FileWrite {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
}

export interface FileDelete {
  path: string;
  delete: true;
}

export type FileChange = FileWrite | FileDelete;

/**
 * Commits one or more file changes (adds/updates/deletes) to a single commit
 * on the configured branch, using the Git Data API so everything lands atomically.
 */
export async function commitFiles(
  changes: FileChange[],
  message: string
): Promise<{ commitSha: string }> {
  const { owner, repo, branch, token } = getConfig();
  const base = `/repos/${owner}/${repo}`;

  const ref = await githubRequest<{ object: { sha: string } }>(
    `${base}/git/ref/heads/${branch}`,
    token
  );
  const parentCommitSha = ref.object.sha;

  const parentCommit = await githubRequest<{ tree: { sha: string } }>(
    `${base}/git/commits/${parentCommitSha}`,
    token
  );
  const baseTreeSha = parentCommit.tree.sha;

  const treeEntries = await Promise.all(
    changes.map(async (change) => {
      if ("delete" in change) {
        return { path: change.path, mode: "100644", type: "blob", sha: null };
      }

      const blob = await githubRequest<{ sha: string }>(`${base}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({ content: change.content, encoding: change.encoding }),
      });

      return { path: change.path, mode: "100644", type: "blob", sha: blob.sha };
    })
  );

  const newTree = await githubRequest<{ sha: string }>(`${base}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });

  const newCommit = await githubRequest<{ sha: string }>(`${base}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [parentCommitSha],
    }),
  });

  try {
    await githubRequest(`${base}/git/refs/heads/${branch}`, token, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha, force: false }),
    });
  } catch {
    throw new GithubCommitError(
      "Não foi possível atualizar a branch (provavelmente alguém commitou ao mesmo tempo). Tente salvar novamente."
    );
  }

  return { commitSha: newCommit.sha };
}

export async function getJsonFile<T>(path: string): Promise<T> {
  const { owner, repo, branch, token } = getConfig();
  const res = await githubRequest<{ content: string; encoding: string }>(
    `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    token
  );

  const content = Buffer.from(res.content, res.encoding as BufferEncoding).toString("utf-8");
  return JSON.parse(content) as T;
}
