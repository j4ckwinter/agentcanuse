import { createCn } from 'cn/config'

export const FONT_SIZE_TOKENS = ['micro', 'caption', 'label', 'display'] as const

export const cn = createCn({ extend: { classGroups: { 'font-size': [{ text: [...FONT_SIZE_TOKENS] }] } } })
