"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconDownload, IconFileDescription, IconPlus } from "@tabler/icons-react"

import type { FillValue, Template, TemplateField } from "@/lib/types"
import { listTemplates, getTemplate } from "@/lib/mock-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function TemplateFillPage() {
    const router = useRouter()
    const printRef = useRef<HTMLDivElement>(null)

    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [fillValues, setFillValues] = useState<FillValue[]>([])
    const [selectOpen, setSelectOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        listTemplates().then((data) => {
            setTemplates(data)
            setLoading(false)
            if (data.length === 0) {
                setSelectOpen(true)
            }
        })
    }, [])

    const handleSelectTemplate = useCallback(async (id: string) => {
        const template = await getTemplate(id)
        if (template) {
            setSelectedTemplate(template)
            setFillValues(
                template.fields.map((f) => ({
                    fieldId: f.id,
                    value: f.defaultValue ?? (f.type === "multi-select" ? [] : f.type === "number" ? "" : ""),
                }))
            )
        }
    }, [])

    const handleValueChange = useCallback((fieldId: string, value: string | string[]) => {
        setFillValues((prev) => prev.map((fv) => (fv.fieldId === fieldId ? { ...fv, value } : fv)))
    }, [])

    const handleMultiSelectToggle = useCallback((fieldId: string, optionLabel: string) => {
        setFillValues((prev) =>
            prev.map((fv) => {
                if (fv.fieldId !== fieldId) return fv
                const current = Array.isArray(fv.value) ? fv.value : []
                const next = current.includes(optionLabel) ? current.filter((v) => v !== optionLabel) : [...current, optionLabel]
                return { ...fv, value: next }
            })
        )
    }, [])

    const handleExport = useCallback(() => {
        setExporting(true)
        // Use browser print dialog (save as PDF)
        setTimeout(() => {
            window.print()
            setExporting(false)
        }, 100)
    }, [])

    const handleBackToSelect = useCallback(() => {
        setSelectedTemplate(null)
        setFillValues([])
    }, [])

    if (loading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
        )
    }

    return (
        <div className="flex min-h-svh flex-col">
            {/* Header */}
            <header className="no-print flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
                <Button variant="ghost" size="icon-sm" onClick={() => router.push("/")}>
                    <IconArrowLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium">模板填报</span>
                <div className="flex-1" />
                {selectedTemplate && (
                    <>
                        <Button variant="outline" size="sm" onClick={handleBackToSelect}>
                            返回选择
                        </Button>
                        <Button size="sm" onClick={handleExport} disabled={exporting}>
                            <IconDownload className="size-3.5" />
                            {exporting ? "导出中..." : "导出 PDF"}
                        </Button>
                    </>
                )}
            </header>

            {/* Content */}
            {!selectedTemplate ? (
                <div className="flex flex-1 items-center justify-center p-6">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>选择模板</CardTitle>
                            <CardDescription>选择一个已保存的模板开始填报</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {templates.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
                                    <IconFileDescription className="size-10" />
                                    <p className="text-sm">暂无可用的模板</p>
                                    <Button variant="outline" size="sm" onClick={() => router.push("/templates/new")}>
                                        <IconPlus className="size-3.5" />
                                        创建模板
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {templates.map((t) => (
                                        <button
                                            key={t.id}
                                            className="flex w-full items-center gap-3 rounded-sm border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                                            onClick={() => handleSelectTemplate(t.id)}
                                        >
                                            <IconFileDescription className="size-4 shrink-0 text-primary" />
                                            <div className="flex-1 truncate">
                                                <p className="text-xs font-medium">{t.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {t.fields.length} 个字段 · {new Date(t.updatedAt).toLocaleDateString("zh-CN")}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="relative flex-1 overflow-auto bg-muted/30 p-6">
                    {/* Print area */}
                    <div ref={printRef} className="relative mx-auto inline-block min-w-max bg-white shadow-lg print:shadow-none" id="print-area">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedTemplate.bgImage} alt={selectedTemplate.name} className="block max-w-none select-none" draggable={false} />
                        {selectedTemplate.fields.map((field) => (
                            <FillField
                                key={field.id}
                                field={field}
                                value={fillValues.find((fv) => fv.fieldId === field.id)?.value ?? ""}
                                onChange={(v) => handleValueChange(field.id, v)}
                                onMultiToggle={(label) => handleMultiSelectToggle(field.id, label)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Template selection dialog for empty state */}
            <Dialog open={selectOpen && templates.length === 0} onOpenChange={setSelectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>暂无模板</DialogTitle>
                        <DialogDescription>还没有保存任何模板，请先前往模板编辑页面创建模板</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                            返回首页
                        </Button>
                        <Button size="sm" onClick={() => router.push("/templates/new")}>
                            创建模板
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function FillField({
    field,
    value,
    onChange,
    onMultiToggle,
}: {
    field: TemplateField
    value: string | string[]
    onChange: (value: string | string[]) => void
    onMultiToggle: (label: string) => void
}) {
    const selectedOptions = Array.isArray(value) ? value : []

    return (
        <div
            className="absolute flex items-center"
            style={{
                left: field.x,
                top: field.y,
                width: field.width,
                height: field.height,
            }}
        >
            {field.type === "select" ? (
                <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
                    <SelectTrigger className="h-full w-full rounded-sm border-dashed border-gray-400 bg-white/80 text-xs print:border-gray-300 print:bg-white">
                        <SelectValue placeholder={field.required ? `${field.label} *` : field.label} />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options.map((opt) => (
                            <SelectItem key={opt.id} value={opt.label}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : field.type === "multi-select" ? (
                <div className="flex h-full w-full flex-wrap items-center gap-0.5 overflow-auto rounded-sm border border-dashed border-gray-400 bg-white/80 px-1 py-0.5 text-xs print:border-gray-300 print:bg-white">
                    {field.options.map((opt) => {
                        const isSelected = selectedOptions.includes(opt.label)
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                className={cn(
                                    "rounded-sm px-1 py-0.5 text-[10px] transition-colors print:text-black",
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                                )}
                                onClick={() => onMultiToggle(opt.label)}
                            >
                                {opt.label}
                            </button>
                        )
                    })}
                    {field.options.length === 0 && <span className="text-muted-foreground">{field.required ? `${field.label} *` : field.label}</span>}
                </div>
            ) : (
                <Input
                    className="h-full w-full rounded-sm border-dashed border-gray-400 bg-white/80 text-xs print:border-gray-300 print:bg-white"
                    type={field.type === "number" ? "number" : "text"}
                    placeholder={field.required ? `${field.label} *` : field.label}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </div>
    )
}
