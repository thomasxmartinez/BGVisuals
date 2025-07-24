/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INSTRUCTIONS_TEXT: string
  readonly VITE_ABOUT_VISUAL_TEXT: string
  readonly VITE_ABOUT_MIX_TEXT: string
  readonly VITE_ABOUT_ME_TEXT: string
  readonly VITE_ASSEMBLYAI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 