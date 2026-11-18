/** 零依赖工具函数：对象判断、时间格式化、数值夹取与文本拼接。 */

/** 判断值是否为普通对象。 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 把 epoch 毫秒转成 ISO-8601 字符串。 */
export function iso(value: number): string {
  return new Date(value).toISOString();
}

/** 取整并夹在闭区间内；非有限数值用回退值。 */
export function clamp(value: unknown, fallback: number, min: number, max: number): number {
  const chosen = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback;
  return Math.min(max, Math.max(min, chosen));
}

/** 拼接记录消息里的 text 块并去掉首尾空白。 */
export function textOf(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    if (isRecord(block) && block.type === 'text' && typeof block.text === 'string') {
      parts.push(block.text);
    }
  }
  return parts.join('\n').trim();
}