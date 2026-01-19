export const MONTH_NAMES: Record<string, number> = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
};

/**
 * 从日期字符串（如 "Jan 07"）中解析出月份数字（1-12）。
 * 
 * @param dateStr 格式为 "MMM DD" 的日期字符串（例如 "Jan 07"）
 * @returns 月份数字（1-12），如果是无效日期则默认为 1。
 */
export function parseMonthFromDate(dateStr: string): number {
  if (!dateStr) return 1;
  const monthStr = dateStr.split(' ')[0];
  return MONTH_NAMES[monthStr] || 1;
}

/**
 * 将日期字符串解析为月份和日期的数字对象。
 * 
 * @param dateStr 格式为 "MMM DD" 的日期字符串（例如 "Jan 07"）
 * @returns 包含月份和日期数字的对象。
 */
export function parseDate(dateStr: string): { month: number; day: number } {
  if (!dateStr) return { month: 1, day: 1 };
  const parts = dateStr.split(' ');
  return { 
    month: MONTH_NAMES[parts[0]] || 1, 
    day: parseInt(parts[1]) || 1 
  };
}
