// 文件名：src/utils/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args),
  debug: (message: string, ...args: any[]) => {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
  }
};