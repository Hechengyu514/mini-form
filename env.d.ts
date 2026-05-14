/// <reference types="vite/client" />

declare module 'china-area-data' {
  const data: Record<string, unknown>
  export default data
}

declare module 'qrcode' {
  const QRCode: {
    toCanvas(canvas: HTMLCanvasElement, text: string, options?: Record<string, unknown>): Promise<void>
    toDataURL(text: string, options?: Record<string, unknown>): Promise<string>
  }
  export default QRCode
}
