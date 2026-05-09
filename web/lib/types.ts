export type FieldType = "text" | "number" | "select" | "multi-select"

export interface SelectOption {
  id: string
  label: string
}

export interface TemplateField {
  id: string
  type: FieldType
  label: string
  x: number
  y: number
  width: number
  height: number
  options: SelectOption[]
  required: boolean
  defaultValue?: string
}

export interface Template {
  id: string
  name: string
  bgImage: string
  bgFileName: string
  fields: TemplateField[]
  createdAt: string
  updatedAt: string
}

export interface FillValue {
  fieldId: string
  value: string | string[]
}
