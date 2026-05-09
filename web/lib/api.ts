const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BACKEND_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...options?.headers },
        ...options,
    })
    if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
    }
    return res.json()
}

export const api = {
    get: <T>(path: string) => request<T>(path),

    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

    put: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),

    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}

export async function generatePdf(
    templateId: string,
    fillValues: { fieldId: string; value: string | string[] }[]
): Promise<Blob> {
    const res = await fetch(`${BACKEND_URL}/api/templates/${templateId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fillValues }),
    })
    if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
    }
    return res.blob()
}

export { BACKEND_URL }
