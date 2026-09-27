const COOLIFY_URL = process.env.COOLIFY_URL ?? ""
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN ?? ""

function coolifyHeaders() {
  return {
    Authorization: `Bearer ${COOLIFY_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

async function coolifyRequest<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(`${COOLIFY_URL}/api/v1${path}`, {
    method,
    headers: coolifyHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Coolify API ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

export interface CoolifyApp {
  uuid: string
  name: string
  fqdn: string
  status: string
}

export interface CoolifyDeployment {
  uuid: string
  status: string
  logs?: string
}

export async function listServers() {
  return coolifyRequest<{ uuid: string; name: string }[]>("GET", "/servers")
}

export async function createApplication(params: {
  name: string
  serverUuid: string
  environmentName: string
  githubRepo: string       // owner/repo
  branch: string
  buildPack: string        // "nixpacks" | "dockerfile"
  port: number
  domain?: string
}): Promise<CoolifyApp> {
  return coolifyRequest<CoolifyApp>("POST", "/applications/public", {
    name: params.name,
    server_uuid: params.serverUuid,
    environment_name: params.environmentName,
    git_repository: `https://github.com/${params.githubRepo}`,
    git_branch: params.branch,
    build_pack: params.buildPack,
    ports_exposes: String(params.port),
    fqdn: params.domain ? `https://${params.domain}` : undefined,
    instant_deploy: false,
  })
}

export async function getApplication(appUuid: string): Promise<CoolifyApp> {
  return coolifyRequest<CoolifyApp>("GET", `/applications/${appUuid}`)
}

export async function triggerDeploy(appUuid: string): Promise<{ uuid: string }> {
  return coolifyRequest<{ uuid: string }>("GET", `/applications/${appUuid}/start`)
}

export async function getDeploymentStatus(deployUuid: string): Promise<CoolifyDeployment> {
  return coolifyRequest<CoolifyDeployment>("GET", `/deployments/${deployUuid}`)
}

export async function getApplicationDeployments(appUuid: string): Promise<CoolifyDeployment[]> {
  return coolifyRequest<CoolifyDeployment[]>("GET", `/applications/${appUuid}/deployments`)
}
