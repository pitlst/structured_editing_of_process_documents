import type { Template, TemplateField } from "./types"

const STORAGE_KEY = "templates"

function getTemplates(): Template[] {
    if (typeof window === "undefined") return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
        return JSON.parse(raw)
    } catch {
        return []
    }
}

function saveTemplates(templates: Template[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function delay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listTemplates(): Promise<Template[]> {
    await delay()
    return getTemplates()
}

export async function getTemplate(id: string): Promise<Template | null> {
    await delay()
    const templates = getTemplates()
    return templates.find((t) => t.id === id) ?? null
}

export async function createTemplate(data: { name: string; bgImage: string; bgFileName: string; fields: TemplateField[] }): Promise<Template> {
    await delay()
    const templates = getTemplates()
    const now = new Date().toISOString()
    const template: Template = {
        id: crypto.randomUUID(),
        name: data.name,
        bgImage: data.bgImage,
        bgFileName: data.bgFileName,
        fields: data.fields,
        createdAt: now,
        updatedAt: now,
    }
    templates.push(template)
    saveTemplates(templates)
    return template
}

export async function updateTemplate(
    id: string,
    data: {
        name?: string
        fields?: TemplateField[]
    }
): Promise<Template | null> {
    await delay()
    const templates = getTemplates()
    const index = templates.findIndex((t) => t.id === id)
    if (index === -1) return null
    const updated = {
        ...templates[index],
        ...data,
        updatedAt: new Date().toISOString(),
    }
    templates[index] = updated
    saveTemplates(templates)
    return updated
}

export async function deleteTemplate(id: string): Promise<boolean> {
    await delay()
    const templates = getTemplates()
    const filtered = templates.filter((t) => t.id !== id)
    if (filtered.length === templates.length) return false
    saveTemplates(filtered)
    return true
}
