import Link from "next/link"
import { IconFileDescription, IconTemplate } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
    return (
        <div className="flex min-h-svh items-center justify-center p-6">
            <div className="flex flex-col items-center gap-8">
                <div className="text-center">
                    <h1 className="text-2xl font-medium tracking-tight">工艺文件结构化编辑</h1>
                    <p className="mt-1.5 text-xs text-muted-foreground">上传工艺文件模板，设计填报点位，生成标准化工艺卡片</p>
                </div>
                <div className="grid w-full max-w-lg grid-cols-2 gap-4">
                    <Card className="items-center text-center">
                        <CardHeader>
                            <IconTemplate className="size-8 self-center text-primary" />
                            <CardTitle>模板编辑</CardTitle>
                            <CardDescription>上传 PDF/Word 作为背景，在任意位置设计填报点，配置字段类型与选项</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href="/templates/new">创建模板</Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="items-center text-center">
                        <CardHeader>
                            <IconFileDescription className="size-8 self-center text-primary" />
                            <CardTitle>模板填报</CardTitle>
                            <CardDescription>选择已设计好的模板，填写工序内容，生成并下载 PDF 工艺文件</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full" variant="outline">
                                <Link href="/templates/fill">开始填报</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
