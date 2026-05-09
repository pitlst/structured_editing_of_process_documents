"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    IconArrowLeft,
    IconChevronDown,
    IconChevronUp,
    IconPlus,
    IconTrash,
    IconUpload,
    IconDeviceFloppy,
    IconGripVertical,
} from "@tabler/icons-react"

import type { FieldType, TemplateField } from "@/lib/types"
import { createTemplate } from "@/lib/mock-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    text: "文本",
    number: "数字",
    select: "单选",
    "multi-select": "多选",
}

const FIELD_COLORS: Record<FieldType, string> = {
    text: "border-blue-500 bg-blue-500/10",
    number: "border-emerald-500 bg-emerald-500/10",
    select: "border-amber-500 bg-amber-500/10",
    "multi-select": "border-purple-500 bg-purple-500/10",
}

const FIELD_DOT_COLORS: Record<FieldType, string> = {
    text: "bg-blue-500",
    number: "bg-emerald-500",
    select: "bg-amber-500",
    "multi-select": "bg-purple-500",
}

export default function TemplateEditorPage() {
    const router = useRouter()

    const [templateName, setTemplateName] = useState("")
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [bgFileName, setBgFileName] = useState("")
    const [fields, setFields] = useState<TemplateField[]>([])
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null)
    const [listCollapsed, setListCollapsed] = useState(false)

    const canvasRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragOffset = useRef({ x: 0, y: 0 })

    const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string
            setBgImage(dataUrl)
            setBgFileName(file.name)
            if (!templateName) {
                setTemplateName(file.name.replace(/\.[^.]+$/, ""))
            }
        }
        reader.readAsDataURL(file)
    }, [templateName])

    const handleCanvasClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!bgImage || !canvasRef.current || draggingFieldId) return

            const rect = canvasRef.current.getBoundingClientRect()
            const scrollLeft = canvasRef.current.scrollLeft
            const scrollTop = canvasRef.current.scrollTop

            const x = e.clientX - rect.left + scrollLeft
            const y = e.clientY - rect.top + scrollTop

            const newField: TemplateField = {
                id: crypto.randomUUID(),
                type: "text",
                label: `字段 ${fields.length + 1}`,
                x,
                y,
                width: 160,
                height: 32,
                options: [],
                required: false,
            }

            setFields((prev) => [...prev, newField])
            setSelectedFieldId(newField.id)
        },
        [bgImage, fields.length, draggingFieldId]
    )

    const handleFieldMouseDown = useCallback(
        (e: React.MouseEvent, fieldId: string) => {
            e.stopPropagation()
            setSelectedFieldId(fieldId)

            const field = fields.find((f) => f.id === fieldId)
            if (!field || !canvasRef.current) return

            const rect = canvasRef.current.getBoundingClientRect()
            const scrollLeft = canvasRef.current.scrollLeft
            const scrollTop = canvasRef.current.scrollTop
            dragOffset.current = {
                x: e.clientX - rect.left + scrollLeft - field.x,
                y: e.clientY - rect.top + scrollTop - field.y,
            }

            setDraggingFieldId(fieldId)

            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!canvasRef.current) return
                const moveRect = canvasRef.current.getBoundingClientRect()
                const moveScrollLeft = canvasRef.current.scrollLeft
                const moveScrollTop = canvasRef.current.scrollTop

                const newX = moveEvent.clientX - moveRect.left + moveScrollLeft - dragOffset.current.x
                const newY = moveEvent.clientY - moveRect.top + moveScrollTop - dragOffset.current.y

                setFields((prev) =>
                    prev.map((f) =>
                        f.id === fieldId ? { ...f, x: Math.max(0, newX), y: Math.max(0, newY) } : f
                    )
                )
            }

            const handleMouseUp = () => {
                setDraggingFieldId(null)
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
            }

            document.addEventListener("mousemove", handleMouseMove)
            document.addEventListener("mouseup", handleMouseUp)
        },
        [fields]
    )

    const updateField = useCallback(
        (fieldId: string, updates: Partial<TemplateField>) => {
            setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
        },
        []
    )

    const deleteField = useCallback(
        (fieldId: string) => {
            setFields((prev) => prev.filter((f) => f.id !== fieldId))
            if (selectedFieldId === fieldId) {
                setSelectedFieldId(null)
            }
        },
        [selectedFieldId]
    )

    const addOption = useCallback(
        (fieldId: string) => {
            setFields((prev) =>
                prev.map((f) => {
                    if (f.id !== fieldId) return f
                    return {
                        ...f,
                        options: [
                            ...f.options,
                            { id: crypto.randomUUID(), label: `选项 ${f.options.length + 1}` },
                        ],
                    }
                })
            )
        },
        []
    )

    const updateOption = useCallback(
        (fieldId: string, optionId: string, label: string) => {
            setFields((prev) =>
                prev.map((f) => {
                    if (f.id !== fieldId) return f
                    return {
                        ...f,
                        options: f.options.map((o) => (o.id === optionId ? { ...o, label } : o)),
                    }
                })
            )
        },
        []
    )

    const deleteOption = useCallback(
        (fieldId: string, optionId: string) => {
            setFields((prev) =>
                prev.map((f) => {
                    if (f.id !== fieldId) return f
                    return { ...f, options: f.options.filter((o) => o.id !== optionId) }
                })
            )
        },
        []
    )

    const handleSave = useCallback(async () => {
        if (!bgImage || !templateName.trim()) return
        setSaving(true)
        try {
            await createTemplate({
                name: templateName.trim(),
                bgImage,
                bgFileName,
                fields,
            })
            router.push("/templates/fill")
        } catch {
            // ignore
        } finally {
            setSaving(false)
        }
    }, [bgImage, bgFileName, fields, router, templateName])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Delete" && selectedFieldId && !isTypingTarget(e.target)) {
                deleteField(selectedFieldId)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedFieldId, deleteField])

    return (
        <div className="flex h-svh flex-col">
            {/* Header */}
            <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
                <Button variant="ghost" size="icon-sm" onClick={() => router.push("/")}>
                    <IconArrowLeft className="size-4" />
                </Button>
                <Input
                    className="h-7 w-48"
                    placeholder="模板名称"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                />
                <div className="flex-1" />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <IconUpload className="size-3.5" />
                    上传背景文件
                </Button>
                <Button
                    size="sm"
                    disabled={!bgImage || !templateName.trim() || saving}
                    onClick={handleSave}
                >
                    <IconDeviceFloppy className="size-3.5" />
                    {saving ? "保存中..." : "保存模板"}
                </Button>
            </header>

            {/* Main area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Canvas */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {bgImage ? (
                        <div
                            ref={canvasRef}
                            className="relative flex-1 overflow-auto bg-muted/30"
                            onClick={handleCanvasClick}
                            style={{ cursor: draggingFieldId ? "grabbing" : "crosshair" }}
                        >
                            <div className="relative inline-block min-w-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={bgImage}
                                    alt="背景模板"
                                    className="block max-w-none select-none"
                                    draggable={false}
                                />
                                {fields.map((field) => (
                                    <div
                                        key={field.id}
                                        className={cn(
                                            "absolute cursor-grab rounded-sm border-2 bg-opacity-80 transition-colors",
                                            FIELD_COLORS[field.type],
                                            selectedFieldId === field.id && "ring-2 ring-ring ring-offset-1",
                                            draggingFieldId === field.id && "cursor-grabbing opacity-80"
                                        )}
                                        style={{
                                            left: field.x,
                                            top: field.y,
                                            width: field.width,
                                            height: field.height,
                                        }}
                                        onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
                                    >
                                        <div className="flex h-full items-center gap-1 px-1.5">
                                            <IconGripVertical className="size-3 shrink-0 text-muted-foreground" />
                                            <span className="truncate text-[10px] font-medium">
                                                {field.label}
                                            </span>
                                            <Badge variant="outline" className="ml-auto shrink-0 text-[9px]">
                                                {FIELD_TYPE_LABELS[field.type]}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                <IconUpload className="size-10" />
                                <p className="text-sm">上传 PDF 或 Word 文件作为模板背景</p>
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    选择文件
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right sidebar - Field list & config */}
                <div
                    className={cn(
                        "flex shrink-0 flex-col border-l border-border bg-card transition-all",
                        listCollapsed ? "w-10" : "w-72"
                    )}
                >
                    <button
                        className="flex h-8 items-center justify-center border-b border-border text-muted-foreground hover:text-foreground"
                        onClick={() => setListCollapsed(!listCollapsed)}
                    >
                        {listCollapsed ? (
                            <IconChevronUp className="size-3.5" />
                        ) : (
                            <IconChevronDown className="size-3.5" />
                        )}
                    </button>

                    {!listCollapsed && (
                        <div className="flex flex-1 flex-col overflow-hidden">
                            {selectedField ? (
                                <FieldConfigPanel
                                    field={selectedField}
                                    onUpdate={(updates) => updateField(selectedField.id, updates)}
                                    onDelete={() => deleteField(selectedField.id)}
                                    onAddOption={() => addOption(selectedField.id)}
                                    onUpdateOption={(optId, label) =>
                                        updateOption(selectedField.id, optId, label)
                                    }
                                    onDeleteOption={(optId) =>
                                        deleteOption(selectedField.id, optId)
                                    }
                                />
                            ) : (
                                <div className="flex flex-1 flex-col">
                                    <div className="border-b border-border px-3 py-2">
                                        <p className="text-xs font-medium">字段列表</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {fields.length === 0
                                                ? "点击画布添加字段"
                                                : `共 ${fields.length} 个字段`}
                                        </p>
                                    </div>
                                    <div className="flex-1 space-y-1 overflow-auto p-2">
                                        {fields.map((field) => (
                                            <button
                                                key={field.id}
                                                className={cn(
                                                    "flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-xs transition-colors hover:bg-muted",
                                                    selectedFieldId === field.id && "bg-muted"
                                                )}
                                                onClick={() => setSelectedFieldId(field.id)}
                                            >
                                                <span
                                                    className={cn(
                                                        "size-2 shrink-0 rounded-full",
                                                        FIELD_DOT_COLORS[field.type]
                                                    )}
                                                />
                                                <span className="flex-1 truncate">{field.label}</span>
                                                <Badge variant="outline" className="text-[9px]">
                                                    {FIELD_TYPE_LABELS[field.type]}
                                                </Badge>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function FieldConfigPanel({
    field,
    onUpdate,
    onDelete,
    onAddOption,
    onUpdateOption,
    onDeleteOption,
}: {
    field: TemplateField
    onUpdate: (updates: Partial<TemplateField>) => void
    onDelete: () => void
    onAddOption: () => void
    onUpdateOption: (optionId: string, label: string) => void
    onDeleteOption: (optionId: string) => void
}) {
    const needsOptions = field.type === "select" || field.type === "multi-select"

    return (
        <div className="flex flex-1 flex-col overflow-auto">
            <div className="border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">字段配置</p>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="ml-auto text-destructive hover:text-destructive"
                        onClick={onDelete}
                    >
                        <IconTrash className="size-3" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3 p-3">
                <div className="space-y-1.5">
                    <Label>字段名称</Label>
                    <Input
                        value={field.label}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label>字段类型</Label>
                    <Select
                        value={field.type}
                        onValueChange={(v) => onUpdate({ type: v as FieldType })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">文本</SelectItem>
                            <SelectItem value="number">数字</SelectItem>
                            <SelectItem value="select">单选</SelectItem>
                            <SelectItem value="multi-select">多选</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                        <Label>宽度 (px)</Label>
                        <Input
                            type="number"
                            value={field.width}
                            onChange={(e) =>
                                onUpdate({ width: Math.max(60, Number(e.target.value) || 160) })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>高度 (px)</Label>
                        <Input
                            type="number"
                            value={field.height}
                            onChange={(e) =>
                                onUpdate({ height: Math.max(20, Number(e.target.value) || 32) })
                            }
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                        <Label>X 坐标</Label>
                        <Input
                            type="number"
                            value={Math.round(field.x)}
                            onChange={(e) => onUpdate({ x: Number(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Y 坐标</Label>
                        <Input
                            type="number"
                            value={Math.round(field.y)}
                            onChange={(e) => onUpdate({ y: Number(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        checked={field.required}
                        onChange={(e) => onUpdate({ required: e.target.checked })}
                        className="size-3.5"
                    />
                    <Label htmlFor={`required-${field.id}`}>必填</Label>
                </div>

                {needsOptions && (
                    <div className="space-y-2 border-t border-border pt-3">
                        <div className="flex items-center gap-2">
                            <Label>选项列表</Label>
                            <Button variant="outline" size="xs" onClick={onAddOption}>
                                <IconPlus className="size-3" />
                                添加
                            </Button>
                        </div>
                        <div className="space-y-1.5">
                            {field.options.length === 0 && (
                                <p className="text-[10px] text-muted-foreground">暂未添加选项</p>
                            )}
                            {field.options.map((opt) => (
                                <div key={opt.id} className="flex items-center gap-1.5">
                                    <Input
                                        className="h-6 flex-1 text-xs"
                                        value={opt.label}
                                        onChange={(e) => onUpdateOption(opt.id, e.target.value)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => onDeleteOption(opt.id)}
                                    >
                                        <IconTrash className="size-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false
    return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
    )
}
