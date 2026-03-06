export interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 从 Markdown 内容中提取标题生成目录
export function extractToc(content: string): TocItem[] {
  // 1. 只移除代码块（```...```），不移除行内代码
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

  // 2. 提取标题
  const result: TocItem[] = [];
  const counts: Record<string, number> = {};
  const regex = /^(#{1,2})\s+(.+)$/gm;
  let matched: RegExpExecArray | null;

  while ((matched = regex.exec(contentWithoutCodeBlocks)) !== null) {
    const level = matched[1].length;
    const rawText = matched[2].trim();
    const displayText = rawText.replace(/`([^`]+)`/g, '$1');

    const baseId = displayText
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseId) continue;

    let uniqueId = baseId;
    if (counts[baseId]) {
      uniqueId = `${baseId}-${counts[baseId]}`;
      counts[baseId] += 1;
    } else {
      counts[baseId] = 1;
    }

    result.push({ id: uniqueId, text: displayText, level });
  }
  return result;
}
