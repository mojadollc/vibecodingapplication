const GITHUB_API = "https://api.github.com"

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
}

async function githubRequest<T>(
  token: string,
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: githubHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub API ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

export async function getAuthenticatedUser(token: string) {
  return githubRequest<{ login: string; id: number }>(token, "GET", "/user")
}

export async function createRepo(
  token: string,
  name: string,
  description: string,
  isPrivate = true
): Promise<{ full_name: string; html_url: string; clone_url: string; default_branch: string }> {
  return githubRequest(token, "POST", "/user/repos", {
    name,
    description,
    private: isPrivate,
    auto_init: false,
  })
}

export async function getRepo(token: string, owner: string, repo: string) {
  return githubRequest<{ full_name: string; default_branch: string }>(
    token,
    "GET",
    `/repos/${owner}/${repo}`
  )
}

export async function getOrCreateRepo(
  token: string,
  repoName: string,
  description: string
): Promise<{ fullName: string; htmlUrl: string; defaultBranch: string }> {
  const user = await getAuthenticatedUser(token)
  try {
    const existing = await getRepo(token, user.login, repoName)
    return {
      fullName: existing.full_name,
      htmlUrl: `https://github.com/${existing.full_name}`,
      defaultBranch: existing.default_branch,
    }
  } catch {
    const created = await createRepo(token, repoName, description)
    return {
      fullName: created.full_name,
      htmlUrl: created.html_url,
      defaultBranch: "main",
    }
  }
}

export async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  try {
    const res = await githubRequest<{ sha: string }>(
      token,
      "GET",
      `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    )
    return res.sha
  } catch {
    return null
  }
}

export async function pushFile(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  message: string,
  branch: string
): Promise<void> {
  const sha = await getFileSha(token, owner, repo, filePath, branch)
  const encoded = Buffer.from(content, "utf-8").toString("base64")

  await githubRequest(token, "PUT", `/repos/${owner}/${repo}/contents/${filePath}`, {
    message,
    content: encoded,
    branch,
    ...(sha ? { sha } : {}),
  })
}

export async function pushFiles(
  token: string,
  owner: string,
  repo: string,
  files: { path: string; content: string }[],
  branch: string,
  commitMessage: string
): Promise<string> {
  // Get or create branch ref
  let baseSha: string | null = null
  try {
    const ref = await githubRequest<{ object: { sha: string } }>(
      token,
      "GET",
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`
    )
    baseSha = ref.object.sha
  } catch {
    // Branch doesn't exist yet — init with empty commit
    const initRes = await githubRequest<{ sha: string }>(
      token,
      "POST",
      `/repos/${owner}/${repo}/git/commits`,
      { message: "Initial commit", tree: await createEmptyTree(token, owner, repo), parents: [] }
    )
    baseSha = initRes.sha
    await githubRequest(token, "POST", `/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    })
  }

  // Create blobs for all files
  const treeItems = await Promise.all(
    files.map(async (f) => {
      const blob = await githubRequest<{ sha: string }>(
        token,
        "POST",
        `/repos/${owner}/${repo}/git/blobs`,
        { content: f.content, encoding: "utf-8" }
      )
      return { path: f.path, mode: "100644", type: "blob", sha: blob.sha }
    })
  )

  // Create tree
  const tree = await githubRequest<{ sha: string }>(
    token,
    "POST",
    `/repos/${owner}/${repo}/git/trees`,
    { base_tree: baseSha, tree: treeItems }
  )

  // Create commit
  const commit = await githubRequest<{ sha: string }>(
    token,
    "POST",
    `/repos/${owner}/${repo}/git/commits`,
    { message: commitMessage, tree: tree.sha, parents: [baseSha] }
  )

  // Update branch ref
  await githubRequest(token, "PATCH", `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: commit.sha,
    force: true,
  })

  return commit.sha
}

async function createEmptyTree(token: string, owner: string, repo: string): Promise<string> {
  const tree = await githubRequest<{ sha: string }>(
    token,
    "POST",
    `/repos/${owner}/${repo}/git/trees`,
    { tree: [] }
  )
  return tree.sha
}
