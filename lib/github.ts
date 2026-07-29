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
): Promise<{ status: number; data: T | null }> {
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

  if (res.status === 404) {
    return { status: 404, data: null };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GithubCommitError(
      `Erro na API do GitHub (${res.status}): ${body || res.statusText}`
    );
  }

  const data = (await res.json().catch(() => null)) as T | null;
  return { status: res.status, data };
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

async function getFileSha(
  base: string,
  token: string,
  branch: string,
  path: string
): Promise<string | null> {
  const { data } = await githubRequest<{ sha: string }>(
    `${base}/contents/${path}?ref=${branch}`,
    token
  );
  return data?.sha ?? null;
}

/**
 * Applies one or more file changes (create/update/delete) using the GitHub
 * Contents API — one commit per file. Fine-grained personal access tokens
 * (scoped to a single repo) only support this API, not the Git Data API
 * (blobs/trees/commits), so this is the endpoint that actually works with a
 * repo-restricted token.
 */
export async function commitFiles(
  changes: FileChange[],
  message: string
): Promise<{ commitSha: string | null }> {
  const { owner, repo, branch, token } = getConfig();
  const base = `/repos/${owner}/${repo}`;

  let lastCommitSha: string | null = null;

  for (const change of changes) {
    if ("delete" in change) {
      const sha = await getFileSha(base, token, branch, change.path);
      if (!sha) continue; // already gone, nothing to delete

      const { data } = await githubRequest<{ commit: { sha: string } }>(
        `${base}/contents/${change.path}`,
        token,
        {
          method: "DELETE",
          body: JSON.stringify({ message, sha, branch }),
        }
      );
      lastCommitSha = data?.commit.sha ?? lastCommitSha;
    } else {
      const contentBase64 =
        change.encoding === "base64"
          ? change.content
          : Buffer.from(change.content, "utf-8").toString("base64");
      const sha = await getFileSha(base, token, branch, change.path);

      const { data } = await githubRequest<{ commit: { sha: string } }>(
        `${base}/contents/${change.path}`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            message,
            content: contentBase64,
            branch,
            ...(sha ? { sha } : {}),
          }),
        }
      );
      lastCommitSha = data?.commit.sha ?? lastCommitSha;
    }
  }

  return { commitSha: lastCommitSha };
}

export async function getJsonFile<T>(path: string): Promise<T> {
  const { owner, repo, branch, token } = getConfig();
  const { data } = await githubRequest<{ content: string; encoding: string }>(
    `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    token
  );

  if (!data) {
    throw new GithubCommitError(`Arquivo ${path} não encontrado no repositório.`);
  }

  const content = Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf-8");
  return JSON.parse(content) as T;
}
