import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

// createRemoteJWKSet caches the key set in memory and only refetches when a
// token references a key it hasn't seen, so this does not poll the endpoint.
const jwks = createRemoteJWKSet(new URL(JWKS_URL));

export class UnauthorizedError extends Error {}

export async function requireFirebaseUser(request: Request): Promise<string> {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Faça login para continuar.");
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID não configurado no servidor.");
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    if (typeof payload.sub !== "string" || !payload.sub) {
      throw new UnauthorizedError("Token inválido.");
    }

    return payload.sub;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Sessão inválida ou expirada. Faça login novamente.");
  }
}
