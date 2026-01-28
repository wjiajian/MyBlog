---
slug: rag-stage3
title: Agent 学习：工程化优化与高级 RAG 技术
year: 2025
date: 2025-12-08
description: 从跑通代码到解决真实世界的复杂场景。本篇深入讲解固定长度、句子级、递归等多种切分策略的适用场景，结合BM25关键词检索与语义检索构建混合检索系统，并介绍重排序技术优化Top-K检索结果，最终构建生产级RAG系统。
coverImage: https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop
tags:
  - Agent
  - RAG
  - 文本切分
  - 混合检索
categories: 笔记
type: tech
---

> **核心理念**：从"跑通代码"到"解决真实世界的复杂脏活"，掌握生产级 RAG 系统的工程化深度。

---

## 📋 实验目标

1. **掌握高级切分策略**：理解不同切分方法的适用场景和效果差异
2. **优化检索准确度**：学习混合检索、重排序等先进技术
3. **管理上下文窗口**：解决长文档、成本控制等工程难题
4. **实战项目**：构建"智能投后报告分析助手"，处理真实复杂场景
5. **性能调优**：建立评估体系，持续优化系统性能

---

## 🛠️ 实验环境准备

### 升级依赖安装

```bash
# 激活第二阶段环境
# rag_env\Scripts\activate  # Windows
# source rag_env/bin/activate  # Linux/Mac

# 安装高级依赖
pip install matplotlib seaborn scikit-learn
pip install rank_bm25  # 关键词检索
pip install sentence-transformers[visualization]  # 可视化工具
pip install umap-learn  # 降维可视化
pip install jieba  # 中文分词

# 可选：高级向量数据库
pip install qdrant-client  # Qdrant 向量数据库
pip install pymilvus  # Milvus 向量数据库

# 文档解析工具
pip install unstructured
pip install pymupdf  # PDF 处理
pip install pandas openpyxl  # 表格处理
```

### 环境验证


```python
import sys

def test_dependencies():
    """测试Stage 3环境依赖"""
    deps = {
        'sentence_transformers': 'sentence-transformers',
        'faiss': 'faiss-cpu',
        'sklearn': 'scikit-learn',
        'matplotlib': 'matplotlib',
        'seaborn': 'seaborn',
        'rank_bm25': 'rank_bm25',
        'umap': 'umap-learn',
        'unstructured': 'unstructured',
        'fitz': 'pymupdf',
        'pandas': 'pandas',
        'jieba': 'jieba',
    }

    print("=" * 60)
    print("Stage 3 依赖检查")
    print("=" * 60)

    missing = []
    for name, package in deps.items():
        try:
            module = __import__(name)
            version = getattr(module, '__version__', 'unknown')
            print(f"✅ {package:20s} v{version}")
        except ImportError:
            print(f"❌ {package:20s} 未安装")
            missing.append(package)

    if missing:
        print(f"\n⚠️  请安装缺失依赖: pip install {' '.join(missing)}")
        return False
    else:
        print("\n✅ 所有依赖已就绪！")
        return True

if __name__ == "__main__":
    success = test_dependencies()
    sys.exit(0)
```

---

## 实验一：高级切分策略 (Advanced Chunking)

### 实验目标

深入理解不同切分策略对检索效果的影响，掌握何时使用何种切分方法。

### 理论基础

#### 1. 切分策略对比

| 策略 | 实现难度 | 检索效果 | 上下文保持 | 计算成本 | 适用场景 |
|------|----------|----------|------------|----------|----------|
| 固定长度 | ⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | 简单文档、日志 |
| 句子级 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | 论文、新闻 |
| 段落级 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 常规文档 |
| 递归切分 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 通用场景 |
| 语义切分 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | 复杂文档 |

#### 2. Overlap 窗口策略

**问题**：切分时丢失跨块上下文信息
**解决方案**：相邻块之间保留重叠区域

```
块1: [AAAAAAAAAA]BBBBBBBBB
块2:          [CCCCCCCCCC]DDDDDDDDD
      ↑ 重叠区域 ↑

最佳实践：
- 重叠比例: 10-20%
- 重叠过少: 丢失语义
- 重叠过多: 浪费存储
```

### 实验步骤

#### Step 1: 实现多种切分策略


```python
import re
import numpy as np
from typing import List, Tuple, Optional, Generator
from dataclasses import dataclass

@dataclass
class Chunk:
    """文本块数据结构"""
    __slots__ = ['text', 'start', 'end', 'chunk_id', 'token_count']  # 优化内存占用
    text: str
    start: int
    end: int
    chunk_id: int
    token_count: int

class AdvancedChunker:
    """高级文本切分器（高性能版）"""

    def __init__(self):
        self.chunk_id_counter = 0
        # 预编译正则，提高性能
        self.sentence_split_pattern = re.compile(r'[。！？；.!?;]')

    def count_tokens(self, text: str) -> int:
        """简单token计数（中文按字符）"""
        return len(text)

    def _create_chunk(self, text: str, start: int, end: int) -> Chunk:
        """内部辅助方法：快速创建Chunk"""
        chunk = Chunk(
            text=text,
            start=start,
            end=end,
            chunk_id=self.chunk_id_counter,
            token_count=len(text)
        )
        self.chunk_id_counter += 1
        return chunk

    def chunk_by_fixed_length(
        self,
        text: str,
        chunk_size: int = 200,
        overlap: int = 20
    ) -> List[Chunk]:
        """
        固定长度切分（优化：使用range步进，减少切片开销）
        """
        chunks = []
        text_len = len(text)
        
        # 步进处理，避免while循环中的重复计算
        step = chunk_size - overlap if overlap > 0 else chunk_size
        if step <= 0: step = 1 # 防止死循环
        
        for start in range(0, text_len, step):
            end = min(start + chunk_size, text_len)
            # 如果是最后一段且由overlap导致重复，需要判断（原逻辑保留）
            if start > 0 and end == text_len and (start + overlap) > text_len:
                 # 这种情况下可能会产生非常短的尾巴或者重复，根据原逻辑直接切分即可
                 pass

            chunk_text = text[start:end]
            chunks.append(self._create_chunk(chunk_text, start, end))
            
            if end == text_len:
                break

        return chunks

    def chunk_by_sentences(self, text: str, min_chunk_size: int = 50) -> List[Chunk]:
        """
        句子级切分（优化：使用列表缓存替代字符串拼接）
        """
        # 使用 split 切分，注意：原逻辑会丢失分隔符，这里保持原逻辑行为
        # 也就是原逻辑会把 '。' 丢掉，然后手动加回来
        sentences = self.sentence_split_pattern.split(text)

        chunks = []
        current_buffer = []  # 使用列表代替字符串+=
        current_len = 0
        
        # 追踪文本位置
        current_pos = 0 
        chunk_start = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # 原逻辑：每个句子手动加句号
            sentence_with_punct = sentence + "。"
            sent_len = len(sentence_with_punct)

            # 如果加上这个句子会太长，保存当前chunk
            if current_len + sent_len > 300 and current_buffer:
                text_content = "".join(current_buffer)
                chunks.append(self._create_chunk(
                    text=text_content,
                    start=chunk_start,
                    end=chunk_start + len(text_content)
                ))
                
                # 重置Buffer
                current_buffer = [sentence_with_punct]
                current_len = sent_len
                # 更新下一个块的起始位置（近似值，因为原逻辑通过strip和加句号修改了文本，无法精确对应原文位置）
                # 这里为了性能和逻辑连续性，我们累加长度
                chunk_start += len(text_content) 
            else:
                current_buffer.append(sentence_with_punct)
                current_len += sent_len

        # 添加最后一个chunk
        if current_buffer:
            text_content = "".join(current_buffer)
            chunks.append(self._create_chunk(
                text=text_content,
                start=chunk_start,
                end=chunk_start + len(text_content)
            ))

        return chunks

    def chunk_by_recursive(
        self,
        text: str,
        chunk_size: int = 300,
        overlap: int = 30,
        separators: List[str] = None
    ) -> List[Chunk]:
        """
        递归切分（优化：生成器模式 + 列表缓存，大幅降低内存和CPU消耗）
        """
        if separators is None:
            separators = ['\n\n', '\n', '。', '；', '，', '']

        # 内部生成器：流式产生文本片段，避免构建巨大的中间列表
        def _recursive_split_gen(text_segment: str, seps: List[str]) -> Generator[str, None, None]:
            if not seps or len(text_segment) <= chunk_size:
                if text_segment:
                    yield text_segment
                return

            separator = seps[0]
            # 只有当separator存在时才split，否则直接由split处理（split空串会报错）
            if separator:
                parts = text_segment.split(separator)
            else:
                parts = [text_segment]

            # 检查是否需要下一级分割
            # 优化：不需要检查所有part，只要发现有大的就必须递归（或者全部递归）
            # 原逻辑是：如果 any part > chunk_size，则全部进入下一级。
            # 这其实比较低效，通常是分治：大的继续分，小的保留。
            # 但为了保持和原代码逻辑一致（"如果分割后的部分都太大..."），我们保留原意：
            # 原逻辑：if any(...) -> use next separator for ALL text.
            
            if any(len(p) > chunk_size for p in parts):
                yield from _recursive_split_gen(text_segment, seps[1:])
            else:
                for part in parts:
                    if len(part) > chunk_size:
                        # 理论上上面any已经拦截了，但为了安全保留
                        yield from _recursive_split_gen(part, seps[1:])
                    else:
                        yield part

        # 开始处理
        # 这里的parts现在是一个生成器，不会一次性卡死内存
        parts_gen = _recursive_split_gen(text, separators)

        chunks = []
        current_buffer = []
        current_len = 0
        
        # 简单的overlap处理缓存
        # 原逻辑 overlap 比较简单，是取 current_chunk 的后半部分
        # 为了高效，我们只在切分时计算 overlap
        
        for part in parts_gen:
            part = part.strip()
            if not part:
                continue

            part_len = len(part)
            
            if current_len + part_len > chunk_size and current_buffer:
                # 1. 生成当前块
                text_content = "".join(current_buffer)
                chunks.append(self._create_chunk(
                    text=text_content,
                    start=0, # 递归切分比较复杂，原代码也是0，这里暂保持为0或需要重写大量逻辑追踪offset
                    end=len(text_content)
                ))

                # 2. 处理 Overlap
                # 从 text_content 末尾取 overlap
                overlap_text = text_content[-overlap:] if overlap > 0 else ""
                
                # 3.以此作为新块的开始
                current_buffer = [overlap_text, part] if overlap_text else [part]
                current_len = len(overlap_text) + part_len
            else:
                current_buffer.append(part)
                current_len += part_len

        # 添加最后一个chunk
        if current_buffer:
            text_content = "".join(current_buffer)
            chunks.append(self._create_chunk(
                text=text_content,
                start=0,
                end=len(text_content)
            ))

        return chunks

# 测试不同切分策略
if __name__ == "__main__":
    # 加载测试数据
    with open('../Stage_2/anthropic.txt', 'r', encoding='utf-8') as f:
        test_text = f.read()[:2000]  # 取前2000字符测试

    chunker = AdvancedChunker()

    # 策略1: 固定长度
    fixed_chunks = chunker.chunk_by_fixed_length(test_text, 200, 20)
    print(f"固定长度切分: {len(fixed_chunks)} 个块")

    # 策略2: 句子级
    sentence_chunks = chunker.chunk_by_sentences(test_text)
    print(f"句子级切分: {len(sentence_chunks)} 个块")

    # 策略3: 递归切分
    recursive_chunks = chunker.chunk_by_recursive(test_text, 300, 30)
    print(f"递归切分: {len(recursive_chunks)} 个块")

    # 分析切分效果
    print("\n=== 切分效果分析 ===")
    for name, chunks in [
        ("固定长度", fixed_chunks),
        ("句子级", sentence_chunks),
        ("递归切分", recursive_chunks)
    ]:
        avg_tokens = np.mean([c.token_count for c in chunks])
        std_tokens = np.std([c.token_count for c in chunks])
        print(f"\n{name}:")
        print(f"  平均Token数: {avg_tokens:.1f} ± {std_tokens:.1f}")
        print(f"  块数量: {len(chunks)}")
        # 增加判断，防止空列表报错
        if chunks:
            print(f"  示例块: {chunks[0].text[:100]}...")
```

    固定长度切分: 11 个块
    句子级切分: 8 个块
    递归切分: 9 个块
    
    === 切分效果分析 ===
    
    固定长度:
      平均Token数: 200.0 ± 0.0
      块数量: 11
      示例块: Anthropic是由OpenAI前高层丹妮拉·阿莫迪（Daniela Amodei）和达里奥·阿莫迪（Dario Amodei）于2021年创立的人工智能公司，总部位于美国加州旧金山，达里奥·阿莫迪...
    
    句子级:
      平均Token数: 248.9 ± 59.3
      块数量: 8
      示例块: Anthropic是由OpenAI前高层丹妮拉·阿莫迪（Daniela Amodei）和达里奥·阿莫迪（Dario Amodei）于2021年创立的人工智能公司，总部位于美国加州旧金山，达里奥·阿莫迪...
    
    递归切分:
      平均Token数: 244.0 ± 45.2
      块数量: 9
      示例块: Anthropic是由OpenAI前高层丹妮拉·阿莫迪（Daniela Amodei）和达里奥·阿莫迪（Dario Amodei）于2021年创立的人工智能公司，总部位于美国加州旧金山，达里奥·阿莫迪...
    

#### Step 2: 切分效果评估


```python
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import matplotlib.pyplot as plt
import os

# 设置中文字体以解决警告问题
def setup_chinese_font():
    """设置中文字体支持"""
    try:
        # 方法1: 使用系统字体
        import matplotlib
        system_fonts = matplotlib.font_manager.get_font_names()
        
        # 常见中文字体列表（按优先级排序）
        chinese_fonts = [
            'SimHei',       # Windows 黑体
            'Microsoft YaHei',  # Windows 微软雅黑
            'STHeiti',      # Mac 黑体
            'STXihei',      # Mac 细黑
            'STKaiti',      # Mac 楷体
            'STSong',       # Mac 宋体
            'STFangsong',   # Mac 仿宋
            'SimSun',       # Windows 宋体
            'NSimSun',      # Windows 新宋体
            'FangSong',     # Windows 仿宋
            'KaiTi',        # Windows 楷体
            'Arial Unicode MS',  # 通用字体
            'DejaVu Sans'   # Linux 默认
        ]
        
        # 检查系统可用的中文字体
        available_fonts = []
        for font in chinese_fonts:
            if font in system_fonts:
                available_fonts.append(font)
        
        if available_fonts:
            # 设置字体
            plt.rcParams['font.sans-serif'] = available_fonts
            plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题
            
            # 清除matplotlib缓存
            matplotlib.font_manager._rebuild()
            
            print(f"✓ 已设置中文字体: {available_fonts[0]}")
            return True
        else:
            # 方法2: 尝试下载中文字体
            print("⚠ 未找到系统中文字体，尝试下载...")
            return download_chinese_font()
            
    except Exception as e:
        print(f"字体设置失败: {e}")
        return False

def download_chinese_font():
    """下载中文字体"""
    try:
        import urllib.request
        import zipfile
        import tempfile
        
        # 从GitHub下载开源中文字体
        font_url = "https://github.com/googlefonts/noto-cjk/raw/main/Sans/NotoSansSC-Regular.otf"
        font_path = os.path.join(tempfile.gettempdir(), "NotoSansSC-Regular.otf")
        
        # 下载字体文件
        urllib.request.urlretrieve(font_url, font_path)
        
        # 添加到matplotlib字体管理器
        import matplotlib.font_manager as fm
        fm.fontManager.addfont(font_path)
        
        # 设置字体
        font_name = fm.FontProperties(fname=font_path).get_name()
        plt.rcParams['font.sans-serif'] = [font_name]
        plt.rcParams['axes.unicode_minus'] = False
        
        print(f"✓ 已下载并使用中文字体: {font_name}")
        return True
        
    except Exception as e:
        print(f"下载字体失败: {e}")
        print("⚠ 将使用默认字体，中文可能显示为方框")
        return False

# 在类定义前设置字体
setup_chinese_font()

class ChunkingEvaluator:
    """切分效果评估器"""

    def __init__(self, embedding_model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(embedding_model_name)

    def compute_coherence_score(self, chunks: List[Chunk]) -> float:
        """
        计算语义连贯性分数
        相邻块之间的相似度越高，连贯性越好
        """
        if len(chunks) < 2:
            return 1.0

        embeddings = self.model.encode([c.text for c in chunks])
        similarities = []

        for i in range(len(chunks) - 1):
            sim = cosine_similarity([embeddings[i]], [embeddings[i+1]])[0][0]
            similarities.append(sim)

        return np.mean(similarities)

    def compute_completeness_score(self, chunks: List[Chunk], original_text: str) -> float:
        """
        计算完整性分数
        文本覆盖率
        """
        total_covered = sum(len(c.text) for c in chunks)
        overlap = sum(max(0, len(c.text) - 200) for c in chunks[:-1])  # 估算重叠
        unique_covered = total_covered - overlap

        return min(unique_covered / len(original_text), 1.0)

    def evaluate_chunking_strategy(self, text: str, strategy_func, **kwargs) -> dict:
        """评估某种切分策略"""
        chunks = strategy_func(text, **kwargs)

        coherence = self.compute_coherence_score(chunks)
        completeness = self.compute_completeness_score(chunks, text)

        # 计算平均块大小和方差
        chunk_sizes = [len(c.text) for c in chunks]
        avg_size = np.mean(chunk_sizes)
        std_size = np.std(chunk_sizes)

        return {
            'strategy': strategy_func.__name__,
            'chunk_count': len(chunks),
            'coherence_score': coherence,
            'completeness_score': completeness,
            'avg_chunk_size': avg_size,
            'std_chunk_size': std_size,
            'chunks': chunks
        }

# 综合评估
if __name__ == "__main__":
    # 加载测试数据
    with open('../Stage_2/xyj.txt', 'r', encoding='utf-8') as f:
        test_text = f.read()[:3000]

    chunker = AdvancedChunker()
    evaluator = ChunkingEvaluator()

    strategies = [
        ('固定长度', chunker.chunk_by_fixed_length, {'chunk_size': 200, 'overlap': 20}),
        ('固定长度(大)', chunker.chunk_by_fixed_length, {'chunk_size': 300, 'overlap': 30}),
        ('句子级', chunker.chunk_by_sentences, {}),
        ('递归切分', chunker.chunk_by_recursive, {'chunk_size': 300, 'overlap': 30})
    ]

    results = []
    print("=" * 80)
    print("切分策略综合评估")
    print("=" * 80)

    for name, func, params in strategies:
        result = evaluator.evaluate_chunking_strategy(test_text, func, **params)
        results.append(result)

        print(f"\n【{name}】")
        print(f"  块数量: {result['chunk_count']}")
        print(f"  语义连贯性: {result['coherence_score']:.3f} (越高越好)")
        print(f"  完整性: {result['completeness_score']:.3f}")
        print(f"  平均块大小: {result['avg_chunk_size']:.0f} ± {result['std_chunk_size']:.0f}")

    # 生成可视化报告
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    # 策略对比
    names = [r['strategy'].replace('chunk_by_', '').replace('_', ' ') for r in results]
    coherence_scores = [r['coherence_score'] for r in results]
    completeness_scores = [r['completeness_score'] for r in results]

    axes[0, 0].bar(names, coherence_scores)
    axes[0,0].set_title('语义连贯性对比')
    axes[0,0].set_ylabel('连贯性分数')
    axes[0,0].tick_params(axis='x', rotation=45)

    axes[0,1].bar(names, completeness_scores)
    axes[0,1].set_title('文本完整性对比')
    axes[0,1].set_ylabel('完整性分数')
    axes[0,1].tick_params(axis='x', rotation=45)

    chunk_counts = [r['chunk_count'] for r in results]
    axes[1,0].bar(names, chunk_counts)
    axes[1,0].set_title('生成块数量对比')
    axes[1,0].set_ylabel('块数量')

    avg_sizes = [r['avg_chunk_size'] for r in results]
    axes[1,1].bar(names, avg_sizes)
    axes[1,1].set_title('平均块大小对比')
    axes[1,1].set_ylabel('字符数')

    plt.tight_layout()
    plt.savefig('chunking_evaluation.png', dpi=150, bbox_inches='tight')
    print("\n✅ 评估图表已保存为 chunking_evaluation.png")

    # 推荐策略
    print("\n" + "=" * 80)
    print("策略推荐")
    print("=" * 80)
    print("📌 通用场景: 递归切分")
    print("   - 平衡了语义连贯性和完整性")
    print("   - 自适应不同类型的文档结构")
    print("📌 简单文档: 固定长度(300字符, 30重叠)")
    print("   - 速度快，可预测")
    print("   - 适合日志、代码等结构化内容")
    print("📌 文学/学术文本: 句子级切分")
    print("   - 保持句子完整性")
    print("   - 适合诗歌、论文等需要保持语义单元的内容")
```
    ================================================================================
    切分策略综合评估
    ================================================================================
    
    【固定长度】
      块数量: 17
      语义连贯性: 0.772 (越高越好)
      完整性: 1.000
      平均块大小: 195 ± 19
    
    【固定长度(大)】
      块数量: 11
      语义连贯性: 0.773 (越高越好)
      完整性: 0.767
      平均块大小: 300 ± 0
    
    【句子级】
      块数量: 11
      语义连贯性: 0.774 (越高越好)
      完整性: 0.723
      平均块大小: 273 ± 37
    
    【递归切分】
      块数量: 12
      语义连贯性: 0.804 (越高越好)
      完整性: 0.798
      平均块大小: 269 ± 27
    
    ✅ 评估图表已保存为 chunking_evaluation.png
    
    ================================================================================
    策略推荐
    ================================================================================
    📌 通用场景: 递归切分
       - 平衡了语义连贯性和完整性
       - 自适应不同类型的文档结构
    📌 简单文档: 固定长度(300字符, 30重叠)
       - 速度快，可预测
       - 适合日志、代码等结构化内容
    📌 文学/学术文本: 句子级切分
       - 保持句子完整性
       - 适合诗歌、论文等需要保持语义单元的内容
    
    
**测试日期**: 2025-12-05

#### 固定长度切分

```python
# 配置参数
chunk_size = 200
overlap = 20

# 测试结果
块数量: 17
平均Token数: 195.0 ± 19
语义连贯性分数: 0.772
```

**观察**:
- 重叠比例20%时，上下丢失情况: overlap 为 40 时比 20 高4.4%
- 最优overlap值: 50 -> 0.810

#### 递归切分

```python
# 配置参数
chunk_size = 300
overlap = 30
separators = ['\n\n', '\n', '。', '']

# 测试结果
块数量: 12
平均Token数: 269.0 ± 27.0
语义连贯性分数: 0.804
```

**观察**:
- 递归切分 vs 固定长度的语义连贯性提升: 4.4%
- 适用场景: 

通用场景: 递归切分
   - 平衡了语义连贯性和完整性
   - 自适应不同类型的文档结构

简单文档: 固定长度(300字符, 30重叠)
   - 速度快，可预测
   - 适合日志、代码等结构化内容

文学/学术文本: 句子级切分
   - 保持句子完整性
   - 适合诗歌、论文等需要保持语义单元的内容

#### 对比结果

| 策略 | 块数量 | 语义连贯性 | 完整性 | 推荐度 |
|------|--------|------------|--------|--------|
| 固定长度 | 17 | 0.772 | 1.000 | ⭐⭐ |
| 句子级 | 11 | 0.774 | 0.723 | ⭐⭐⭐ |
| 递归切分 | 12 | 0.804 | 0.798 | ⭐⭐⭐⭐⭐ |

### 实验一练习题

1. **重叠窗口优化实验**：分别测试 overlap = 0, 10, 20, 30, 40, 50，找出最佳重叠比例
2. **混合策略实验**：对文档不同部分使用不同切分策略（如标题用句子级，正文用递归）
3. **领域特化实验**：对法律文书、医学论文等特定领域文本，设计专用切分策略

### 发现与思考

**问题1**: 当文档结构不规律时，哪种策略最鲁棒？
- 答案: 递归切分
- 证据: 通过多级分隔符（段落→句子→词语）自动适应不规律结构，能在自然边界处切分，保持语义完整性，最适合混合格式文档

**问题2**: Overlap比例对召回率的影响？
- 测试了overlap = 0, 10, 20, 30, 50
- 最佳值: 50
- 原因分析: 重叠 50 字符确保关键信息不会在切分处丢失,向量检索时，即使部分信息在边界处，仍有足够上下文被匹配到

**问题3**: 如何针对特定领域优化切分？
- 法律文档: 按条款/章节切分，保持条款完整性，识别"第X条"、"第X款"等法律标记
- 技术文档: 代码块与文本分离，API文档按方法/类切分，保留代码上下文
- 财务报表: 表格结构化切分，按会计科目/时间周期划分，保留表头与数据关联

## 实验二：检索准确度优化 (Retrieval Optimization)

### 实验目标

掌握混合检索、重排序等先进技术，显著提升检索质量。

### 理论基础

#### 1. 传统检索 vs 语义检索

| 维度 | 关键词检索 (BM25) | 语义检索 (Dense) | 混合检索 |
|------|------------------|------------------|----------|
| 原理 | TF-IDF统计 | 向量相似度 | 加权融合 |
| 优点 | 精确匹配、速度快 | 语义理解、鲁棒性好 | 综合优势 |
| 缺点 | 无法理解语义 | 可能过度泛化 | 实现复杂 |
| 适用 | 精确查询、专业术语 | 同义表达、语义理解 | 复杂查询 |

#### 2. 重排序 (Reranking)

**问题**：Top-K检索可能包含不相关结果
**解决**：使用更强的模型对初步结果重新排序

```
初始检索 (100个结果) → 重排序模型 → Top-10最终结果
```

### 实验步骤

#### Step 1: 实现混合检索


```python
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from typing import List, Tuple
import jieba

class HybridRetriever:
    """混合检索器：BM25 + 语义检索"""

    def __init__(self, semantic_weight=0.7, bm25_weight=0.3):
        self.semantic_weight = semantic_weight
        self.bm25_weight = bm25_weight
        self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunks = []
        self.chunk_embeddings = None
        self.bm25 = None
        self.tokenized_chunks = []

    def fit(self, chunks: List[Chunk]):
        """
        构建索引
        """
        self.chunks = chunks

        # 1. 语义索引
        self.chunk_embeddings = self.semantic_model.encode([c.text for c in chunks])

        # 2. BM25索引
        tokenized_texts = []
        for chunk in chunks:
            # 中文分词
            tokens = list(jieba.cut(chunk.text))
            tokenized_texts.append(tokens)

        self.tokenized_chunks = tokenized_texts
        self.bm25 = BM25Okapi(tokenized_texts)

        print(f"✅ 索引构建完成: {len(chunks)} 个文档块")

    def search(self, query: str, k: int = 5) -> List[Tuple[float, Chunk]]:
        """
        混合检索
        """
        # 1. 语义检索
        query_embedding = self.semantic_model.encode([query])[0]
        semantic_similarities = np.dot(self.chunk_embeddings, query_embedding)
        semantic_similarities = (semantic_similarities + 1) / 2  # 归一化到[0,1]

        # 2. BM25检索
        query_tokens = list(jieba.cut(query))
        bm25_scores = self.bm25.get_scores(query_tokens)
        bm25_scores = (bm25_scores - np.min(bm25_scores)) / (np.max(bm25_scores) - np.min(bm25_scores) + 1e-8)

        # 3. 加权融合
        hybrid_scores = (
            self.semantic_weight * semantic_similarities +
            self.bm25_weight * bm25_scores
        )

        # 4. Top-K
        top_indices = np.argsort(hybrid_scores)[::-1][:k]

        results = []
        for idx in top_indices:
            score = hybrid_scores[idx]
            results.append((score, self.chunks[idx]))

        return results

    def analyze_query(self, query: str, k: int = 5):
        """分析检索过程"""
        results = self.search(query, k)

        print(f"\n🔍 查询: {query}")
        print("=" * 80)

        # 语义检索得分
        query_embedding = self.semantic_model.encode([query])[0]
        semantic_similarities = np.dot(self.chunk_embeddings, query_embedding)
        semantic_similarities = (semantic_similarities + 1) / 2

        # BM25检索得分
        query_tokens = list(jieba.cut(query))
        bm25_scores = self.bm25.get_scores(query_tokens)
        bm25_scores = (bm25_scores - np.min(bm25_scores)) / (np.max(bm25_scores) - np.min(bm25_scores) + 1e-8)

        print(f"{'排名':<4} {'混合得分':<10} {'语义得分':<10} {'BM25得分':<10} {'文本预览'}")
        print("-" * 80)

        for i, (score, chunk) in enumerate(results, 1):
            semantic_score = semantic_similarities[chunk.chunk_id]
            bm25_score = bm25_scores[chunk.chunk_id]
            preview = chunk.text[:50] + "..." if len(chunk.text) > 50 else chunk.text
            print(f"{i:<4} {score:<10.3f} {semantic_score:<10.3f} {bm25_score:<10.3f} {preview}")

        return results

# 测试混合检索
if __name__ == "__main__":
    # 加载数据
    with open('../Stage_2/anthropic.txt', 'r', encoding='utf-8') as f:
        text = f.read()

    # 切分
    chunker = AdvancedChunker()
    chunks = chunker.chunk_by_recursive(text, 300, 30)

    # 构建混合检索器
    retriever = HybridRetriever(semantic_weight=0.7, bm25_weight=0.3)
    retriever.fit(chunks)

    # 测试查询
    test_queries = [
        "Anthropic公司的发展历程"
    ]

    for query in test_queries:
        retriever.analyze_query(query, k=5)
        print()
```

    ✅ 索引构建完成: 12 个文档块
    
    🔍 查询: Anthropic公司的发展历程
    ================================================================================
    排名   混合得分       语义得分       BM25得分     文本预览
    --------------------------------------------------------------------------------
    1    0.820      0.750      0.983      e的创作，并将AI生成的内容无缝地集成到他们的项目和工作流中2024年3月6日，亚马逊宣布Anthr...
    2    0.802      0.717      1.000      Anthropic是由OpenAI前高层丹妮拉·阿莫迪（Daniela Amodei）和达里奥·阿莫...
    3    0.796      0.783      0.826       Forum），致力于确保安全、负责任地开发前沿人工智能模型2023年8月13日，韩国最大电信运营商...
    4    0.757      0.675      0.950      人左右，大部分成员曾经参与过GPT-2、GPT-3模型的研发同年3月15日，Anthropic推出聊...
    5    0.744      0.725      0.791      opic发布了Claude 2.1，拥有200K的上下文窗口同月，有知情人士表示，Anthropic...
    
    

### 混合检索实验

**测试日期**: 2025-12-05

#### 权重调优实验

```python
# 测试配置
semantic_weight = 0.7
bm25_weight = 0.3

# 检索结果分析
查询: "Anthropic公司发展历程"
Top-5结果:
1. 语义检索得分: 0.750, BM25得分: 0.983
2. 语义检索得分: 0.717, BM25得分: 1.000
3. 语义检索得分: 0.783, BM25得分: 0.826
4. 语义检索得分: 0.675, BM25得分: 0.950
5. 语义检索得分: 0.725, BM25得分: 0.791
```

#### 不同权重配置对比

- 纯语义：(1.0, 0.0)
- 纯BM25：(0.0, 1.0)
- 混合比例：(0.7, 0.3)、(0.5, 0.5)、(0.3, 0.7)

| 比例 | 混合得分 | 语义得分 | BM25得分 | 备注 |
|-----------------|-------------|----------|------|------|
| 1.0, 0.0 | 0.783 | 0.783 | 0.826 |  |
| 0.0, 1.0 | 1.000 | 0.717 | 1.000 |  |
| 0.7, 0.3 | 0.670 | 0.750 | 0.983 |  |
| 0.5, 0.5 | 0.867 | 0.750 | 0.983 |  |
| 0.3, 0.7 | 0.915 | 0.717 | 1.000 |  |

**最佳配置**: 
- Alpha = 1.0 (纯语义)，
场景：推荐系统、FAQ问答（用户描述问题，寻找标准答案）、跨语言搜索。
例子："如何调整心情？" -> 匹配心理健康文档。
- Alpha = 0.0 (纯 BM25)，
场景：代码搜索、SKU/零件编号搜索、法律文书中的特定条款搜索。
例子："func get_user_id()" -> 精确匹配代码库。
- Alpha = 0.5 (平衡，常用默认值)，
场景：通用知识库、RAG（检索增强生成）系统。
原理：既想要同义词扩展，又想确保关键词尽可能出现。
- 偏向 BM25 (e.g., Semantic 0.3, BM25 0.7)，
场景：电商搜索。用户搜 "耐克 红色 跑鞋"，通常希望这三个词都严格匹配，而不是推荐 "阿迪达斯 红色 跑鞋"（虽然语义相近，但在电商场景是错误的）。

#### Step 2: 实现重排序机制


```python
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List, Tuple

class RerankRetriever:
    """带重排序的检索器"""

    def __init__(self, cross_encoder_model='cross-encoder/ms-marco-MiniLM-L-6-v2'):
        self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.rerank_model = CrossEncoder(cross_encoder_model)
        self.chunks = []
        self.chunk_embeddings = None

    def fit(self, chunks: List[Chunk]):
        """构建索引"""
        self.chunks = chunks
        self.chunk_embeddings = self.semantic_model.encode([c.text for c in chunks])
        print(f"✅ 索引构建完成: {len(chunks)} 个文档块")

    def search(self, query: str, initial_k: int = 50, final_k: int = 5) -> List[Tuple[float, Chunk]]:
        """
        两阶段检索：初步检索 + 重排序
        """
        # 阶段1: 初步语义检索
        query_embedding = self.semantic_model.encode([query])[0]
        similarities = np.dot(self.chunk_embeddings, query_embedding)
        top_indices = np.argsort(similarities)[::-1][:initial_k]

        # 准备重排序的query-document pairs
        candidate_pairs = [(query, self.chunks[idx].text) for idx in top_indices]

        # 阶段2: 使用更强的模型重排序
        rerank_scores = self.rerank_model.predict(candidate_pairs)

        # 获取最终Top-K
        reranked_indices = np.argsort(rerank_scores)[::-1][:final_k]

        results = []
        for idx in reranked_indices:
            original_idx = top_indices[idx]
            score = rerank_scores[idx]
            results.append((score, self.chunks[original_idx]))

        return results

    def search_with_ablation(self, query: str):
        """对比有无重排序的效果"""
        # 无重排序
        query_embedding = self.semantic_model.encode([query])[0]
        similarities = np.dot(self.chunk_embeddings, query_embedding)
        initial_top5 = np.argsort(similarities)[::-1][:5]

        # 有重排序
        results = self.search(query, initial_k=20, final_k=5)

        print(f"\n🔍 查询: {query}")
        print("=" * 80)
        print("【仅语义检索 Top-5】")
        for i, idx in enumerate(initial_top5, 1):
            print(f"{i}. {self.chunks[idx].text[:80]}...")
            print(f"   相似度: {similarities[idx]:.3f}")

        print("\n【混合检索 + 重排序 Top-5】")
        for i, (score, chunk) in enumerate(results, 1):
            print(f"{i}. {chunk.text[:80]}...")
            print(f"   重排序得分: {score:.3f}")

        return results

# 测试重排序
if __name__ == "__main__":
    # 加载《红楼梦》文本（更大的数据集）
    with open('../Stage_2/hlm.txt', 'r', encoding='utf-8') as f:
        text = f.read()[:50000]  # 取前5万字符测试

    chunker = AdvancedChunker()
    chunks = chunker.chunk_by_recursive(text, 300, 30)

    retriever = RerankRetriever()
    retriever.fit(chunks)

    # 测试查询
    test_queries = [
        "贾宝玉和林黛玉的关系",
        "薛宝钗的性格特点",
        "红楼梦的主题思想"
    ]

    for query in test_queries:
        retriever.search_with_ablation(query)
        print("\n" + "=" * 80 + "\n")
```

    ✅ 索引构建完成: 195 个文档块
    
    🔍 查询: 贾宝玉和林黛玉的关系
    ================================================================================
    【仅语义检索 Top-5】
    1. 另换了四个眉目秀洁十七八岁的小厮上来抬着轿子，众婆子步下跟随至一垂花门前落下，众小厮俱肃然退出，众婆子上前打起轿帘，扶黛玉下了轿黛玉扶着婆子的手，进了垂花门两边...
       相似度: 0.491
    2. ......
    
    【混合检索 + 重排序 Top-5】
    1. ，游览天下胜迹那日偶又游至维扬地方，闻得今年盐政点的是林如海这林如海，姓林，名海，表字如海，乃是前科的探花，今已升兰台寺大夫本贯姑苏人氏，今钦点为巡盐御史，到任...
       重排序得分: 8.531
    2. ......
    
    ================================================================================
    
   省略
    
    ================================================================================
    
    
    🔍 查询: 红楼梦的主题思想
    ================================================================================
    【仅语义检索 Top-5】
    1. 玉携手同行尤氏等送至大厅前，见灯火辉煌，众小厮们都在丹墀侍立那焦大又恃贾珍不在家，因趁着酒兴，先骂大总管赖二，说他“不公道！欺软怕硬！有好差使，派了别人；这样黑...
       相似度: 0.501
    2. ......
    
    【混合检索 + 重排序 Top-5】
    1. 主要人物的感情纠葛，描写了大观园内外一系列青年男女的爱情故事同时，通过对这些爱情悲剧产生的社会环境描绘，牵涉到封建社会政治法律、宗法、妇女、道德、婚姻等方面的问...
       重排序得分: 8.598
    2. ......
    
    ================================================================================
    
    

#### Step 3: 检索质量评估


```python
import numpy as np
from collections import defaultdict
from typing import List, Dict, Set
import matplotlib.pyplot as plt
from typing import List, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer

class Chunk:
    def __init__(self, chunk_id: int, text: str):
        self.chunk_id = chunk_id
        self.text = text
    
    def __repr__(self):
        return f"Chunk(id={self.chunk_id}, text={self.text[:30]}...)"

class SimpleSemanticRetriever:
    """
    纯语义检索器
    基于 SentenceTransformer 生成向量并计算余弦相似度
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        # 初始化向量模型
        self.semantic_model = SentenceTransformer(model_name)
        self.chunks: List[Chunk] = []
        self.chunk_embeddings = None

    def fit(self, chunks: List[Chunk]):
        """
        构建索引：将所有文档块转换为向量
        """
        self.chunks = chunks
        if not chunks:
            print("⚠️ 警告: 文档块列表为空")
            return

        print("🔄 正在生成语义向量索引...")
        # encode 返回 numpy array，默认 normalize_embeddings=False
        # 如果需要余弦相似度，建议 normalize_embeddings=True 或者在 search 时归一化
        # 这里使用 all-MiniLM-L6-v2，它通常配合余弦相似度使用
        self.chunk_embeddings = self.semantic_model.encode(
            [c.text for c in chunks], 
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True # 归一化后，点积等同于余弦相似度
        )
        print(f"✅ 语义索引构建完成: {len(chunks)} 个文档块")

    def search(self, query: str, k: int = 5) -> List[Tuple[float, Chunk]]:
        """
        检索最相似的文档块
        返回: List[(score, Chunk)]
        """
        if not self.chunks:
            return []

        # 1. 生成查询向量 (同样进行归一化)
        query_embedding = self.semantic_model.encode(
            [query], 
            convert_to_numpy=True, 
            normalize_embeddings=True
        )[0]

        # 2. 计算相似度 (归一化向量的点积 = 余弦相似度)
        # scores shape: (num_chunks,)
        scores = np.dot(self.chunk_embeddings, query_embedding)

        # 3. 获取 Top-K 索引
        # np.argsort 从小到大排序，[::-1] 反转为从大到小
        top_k_indices = np.argsort(scores)[::-1][:k]

        # 4. 组装结果
        results = []
        for idx in top_k_indices:
            results.append((float(scores[idx]), self.chunks[idx]))

        return results

class RetrievalEvaluator:
    """检索质量评估器"""

    def __init__(self):
        self.relevance_judgments = {}  # 查询 -> 相关文档ID集合
        self.retrieval_results = defaultdict(list)

    def add_relevance_judgment(self, query: str, relevant_chunk_ids: Set[int]):
        """添加人工相关性标注"""
        self.relevance_judgments[query] = relevant_chunk_ids

    def evaluate_retrieval(self, query: str, retrieved_chunks: List[Chunk], k: int = 10) -> Dict:
        """评估检索效果"""
        retrieved_ids = {chunk.chunk_id for chunk in retrieved_chunks[:k]}
        relevant_ids = self.relevance_judgments.get(query, set())

        # Precision@k: 检索结果中相关文档的比例
        if k == 0:
            precision_k = 0
        else:
            precision_k = len(retrieved_ids & relevant_ids) / k

        # Recall@k: 检索出的相关文档占所有相关文档的比例
        if len(relevant_ids) == 0:
            recall_k = 1.0
        else:
            recall_k = len(retrieved_ids & relevant_ids) / len(relevant_ids)

        # F1@k
        if precision_k + recall_k == 0:
            f1_k = 0
        else:
            f1_k = 2 * precision_k * recall_k / (precision_k + recall_k)

        # Average Precision (AP)
        ap = self._compute_ap(retrieved_chunks, relevant_ids, k)

        return {
            'precision@k': precision_k,
            'recall@k': recall_k,
            'f1@k': f1_k,
            'ap': ap
        }

    def _compute_ap(self, retrieved_chunks: List[Chunk], relevant_ids: Set[int], k: int) -> float:
        """计算Average Precision"""
        if not relevant_ids or k == 0:
            return 0.0

        precision_sum = 0.0
        relevant_retrieved = 0

        for i, chunk in enumerate(retrieved_chunks[:k]):
            if chunk.chunk_id in relevant_ids:
                relevant_retrieved += 1
                precision_at_i = relevant_retrieved / (i + 1)
                precision_sum += precision_at_i

        return precision_sum / len(relevant_ids)

    def compare_strategies(self, queries: List[str], retrievers: Dict[str, callable]) -> Dict:
        """对比不同检索策略"""
        results = defaultdict(dict)

        for query in queries:
            print(f"\n评估查询: {query}")
            print("-" * 60)

            for strategy_name, retriever_func in retrievers.items():
                retrieved = retriever_func(query)
                metrics = self.evaluate_retrieval(query, retrieved, k=5)
                results[strategy_name][query] = metrics

                print(f"{strategy_name}:")
                print(f"  Precision@5: {metrics['precision@k']:.3f}")
                print(f"  Recall@5: {metrics['recall@k']:.3f}")
                print(f"  F1@5: {metrics['f1@k']:.3f}")

        return results

    def plot_comparison(self, results: Dict):
        """可视化对比结果"""
        strategies = list(results.keys())
        metrics = ['precision@k', 'recall@k', 'f1@k']

        fig, axes = plt.subplots(1, 3, figsize=(15, 5))

        for i, metric in enumerate(metrics):
            scores = []
            for strategy in strategies:
                # 计算所有查询的平均分数
                values = [results[strategy][q][metric] for q in results[strategy].keys()]
                scores.append(np.mean(values))

            axes[i].bar(strategies, scores)
            axes[i].set_title(f'{metric.upper()} 对比')
            axes[i].set_ylabel('分数')
            axes[i].tick_params(axis='x', rotation=45)

        plt.tight_layout()
        plt.savefig('retrieval_comparison.png', dpi=150, bbox_inches='tight')
        print("✅ 对比图表已保存为 retrieval_comparison.png")

# 评估实例
if __name__ == "__main__":
    # 准备测试数据
    with open('../Stage_2/anthropic.txt', 'r', encoding='utf-8') as f:
        text = f.read()

    chunker = AdvancedChunker()
    chunks = chunker.chunk_by_recursive(text, 300, 30)

    # 构建不同检索器
    semantic_retriever = SimpleSemanticRetriever()
    semantic_retriever.fit(chunks)

    hybrid_retriever = HybridRetriever()
    hybrid_retriever.fit(chunks)

    # 评估器
    evaluator = RetrievalEvaluator()

    # 准备查询和标注（这里用关键词匹配模拟人工标注）
    test_queries_config = {
    "Anthropic公司成立时间": ["anthropic", "成立", "时间"],
    "Claude模型特点": ["claude", "特点", "模型"],
    "AI安全研究": ["安全", "safety", "research"],
    "融资轮次": ["融资", "funding", "investment"],
    "创始人信息": ["创始人", "founder", "ceo", "dario"]
    }   

    # 为每个查询标注相关文档（简化版：包含关键词的即为相关）
    queries = list(test_queries_config.keys()) # 提取查询文本
    
    for query_text, keywords in test_queries_config.items():
        # 只要文档包含列表中的 *任意一个* 关键词，就算相关（或者你可以改成 *所有* 关键词）
        relevant_ids = {
            chunk.chunk_id
            for chunk in chunks
            if any(kw.lower() in chunk.text.lower() for kw in keywords)
        }
    
        # 关键：添加打印调试，看看是不是空的
        print(f"查询: '{query_text}' -> 关键词: {keywords} -> 命中相关文档数: {len(relevant_ids)}")
    
        if len(relevant_ids) == 0:
            print(f"⚠️ 警告: 查询 '{query_text}' 没有匹配到任何文档！请检查关键词或文档内容。")
        
        evaluator.add_relevance_judgment(query_text, relevant_ids)

    # 对比策略
    retrievers = {
        '语义检索': lambda q: [x[1] for x in semantic_retriever.search(q, k=5)],
        '混合检索': lambda q: [x[1] for x in hybrid_retriever.search(q, k=5)]
    }
    
    comparison_results = evaluator.compare_strategies(test_queries, retrievers)
    evaluator.plot_comparison(comparison_results)
```

## 实验三：上下文窗口与成本控制 (Context Window Management)

### 实验目标

解决长文档处理和API调用成本控制问题，实现高效的生产级RAG系统。

### 理论基础

#### 1. 上下文窗口管理问题

**挑战**:
- LLM上下文窗口有限
- API调用成本随token数线性增长
- 检索内容过多会稀释相关信息

**解决方案**:
```
多轮检索 → 动态选择 → 上下文压缩 → 成本控制
```

#### 2. 成本模型

```
总成本 = (Prompt Tokens + Context Tokens + Output Tokens) × 单Token价格
```

### 实验步骤

#### Step 1: 实现动态上下文选择


```python
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Tuple
import math

@dataclass
class TokenCount:
    """Token计数器"""
    prompt_base = 50  # 基础prompt token数
    output_estimate = 100  # 预估输出token数

    def count_chunks(self, chunks: List[Chunk]) -> int:
        """估算chunk的token数"""
        return sum(len(c.text) for c in chunks)

    def calculate_context_cost(
        self,
        chunks: List[Chunk],
        max_context_tokens: int = 8000,
        min_chunks: int = 1,
        max_chunks: int = 20
    ) -> Dict:
        """
        计算上下文使用情况
        注意：输入的 chunks 必须已经按优先级（分数）排好序
        """
        if not chunks:
            return {'selected_chunks': [], 'total_tokens': 0, 'chunk_count': 0}

        # 【修复点】：移除 sorted() 调用
        # 原因：chunks 是 Chunk 对象列表，没有 .get() 方法，且调用方已保证顺序
        sorted_chunks = chunks 

        # 贪心选择：按顺序添加，直到 Token 耗尽
        selected = []
        total_tokens = self.prompt_base

        for chunk in sorted_chunks:
            # 这里简单用字符长度估算 Token，实际生产环境可用 tiktoken
            chunk_tokens = len(chunk.text) 
            potential_total = total_tokens + chunk_tokens + self.output_estimate

            # 检查是否超出限制
            if potential_total <= max_context_tokens and len(selected) < max_chunks:
                selected.append(chunk)
                total_tokens += chunk_tokens
            
            # 如果已经满足最小 chunk 数，且 token 用量已达 80%，提前结束
            # (这个逻辑是可选的，看是否想尽可能填满窗口)
            if len(selected) >= min_chunks and total_tokens > max_context_tokens * 0.8:
                break

        return {
            'selected_chunks': selected,
            'total_tokens': total_tokens + self.output_estimate,
            'chunk_count': len(selected),
            'compression_ratio': len(chunks) / len(selected) if selected else 0
        }

class IntelligentContextSelector:
    """智能上下文选择器"""

    def __init__(self, max_context_tokens=8000):
        self.max_context_tokens = max_context_tokens
        self.token_counter = TokenCount()

    def select_optimal_context(
        self,
        query: str,
        retrieval_results: List[Tuple[float, Chunk]],
        min_chunks: int = 2,
        max_chunks: int = 10
    ) -> Dict:
        """
        基于多样性和相关性的上下文选择
        """
        if not retrieval_results:
            return {'context': '', 'selected_chunks': [], 'reasoning': 'No results'}

        # 将检索结果转换为dict格式（包含分数）
        chunks_with_scores = [
            {'chunk': chunk, 'score': score}
            for score, chunk in retrieval_results
        ]

        # 多样性选择：避免选择过于相似的chunk
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')

        embeddings = model.encode([c['chunk'].text for c in chunks_with_scores])
        similarity_matrix = np.dot(embeddings, embeddings.T)

        # 基于多样性的选择
        selected_indices = []
        selected_embeddings = []

        # 优先选择高分chunk
        chunks_sorted = sorted(chunks_with_scores, key=lambda x: x['score'], reverse=True)

        for chunk_info in chunks_sorted:
            idx = chunks_with_scores.index(chunk_info)

            # 检查与已选择chunk的相似度
            if not selected_embeddings:
                selected_indices.append(idx)
                selected_embeddings.append(embeddings[idx])
            else:
                # 计算与已选择chunk的最大相似度
                max_sim = max(
                    np.dot(embeddings[idx], emb) / (
                        np.linalg.norm(embeddings[idx]) * np.linalg.norm(emb)
                    )
                    for emb in selected_embeddings
                )

                # 如果相似度低于阈值（0.8），则选择
                if max_sim < 0.8:
                    selected_indices.append(idx)
                    selected_embeddings.append(embeddings[idx])

            if len(selected_indices) >= max_chunks:
                break

        # 重新排序（按分数）
        selected_indices = sorted(
            selected_indices,
            key=lambda i: chunks_with_scores[i]['score'],
            reverse=True
        )

        selected_chunks = [chunks_with_scores[i]['chunk'] for i in selected_indices]

        # 计算token使用情况
        cost_info = self.token_counter.calculate_context_cost(
            selected_chunks,
            max_context_tokens=self.max_context_tokens,
            min_chunks=min_chunks
        )

        # 构建最终上下文
        context_parts = []
        for i, chunk in enumerate(cost_info['selected_chunks'], 1):
            context_parts.append(f"[{i}] {chunk.text}")

        context = "\n\n".join(context_parts)

        return {
            'context': context,
            'selected_chunks': cost_info['selected_chunks'],
            'total_tokens': cost_info['total_tokens'],
            'chunk_count': cost_info['chunk_count'],
            'compression_ratio': cost_info['compression_ratio'],
            'diversity_score': len(selected_indices) / len(chunks_with_scores)
        }

# 测试上下文选择
if __name__ == "__main__":
    # 加载测试数据
    with open('../Stage_2/anthropic.txt', 'r', encoding='utf-8') as f:
        text = f.read()

    chunker = AdvancedChunker()
    chunks = chunker.chunk_by_recursive(text, 300, 30)

    retriever = SimpleSemanticRetriever()
    retriever.fit(chunks)

    selector = IntelligentContextSelector(max_context_tokens=4000)

    # 测试查询
    test_queries = [
        "Anthropic的融资和估值是多少？",
        "Claude 3.5有什么新功能？",
        "AI安全方面他们做了什么？"
    ]

    for query in test_queries:
        print(f"\n{'='*80}")
        print(f"查询: {query}")
        print('='*80)

        # 检索更多结果用于选择
        retrieval_results = retriever.search(query, k=20)

        # 智能选择上下文
        context_info = selector.select_optimal_context(
            query,
            retrieval_results,
            min_chunks=2,
            max_chunks=5
        )

        print(f"\n📊 上下文统计:")
        print(f"  选择chunk数: {context_info['chunk_count']}")
        print(f"  总Token数: {context_info['total_tokens']}")
        print(f"  压缩比: {context_info['compression_ratio']:.2f}x")
        print(f"  多样性得分: {context_info['diversity_score']:.3f}")

        print(f"\n📄 选择的上下文:")
        print(context_info['context'][:50] + "..." if len(context_info['context']) > 50 else context_info['context'])
```

    🔄 正在生成语义向量索引...
    ✅ 语义索引构建完成: 2 个文档块
    
    ================================================================================
    查询: Anthropic的融资和估值是多少？
    ================================================================================
    
    📊 上下文统计:
      选择chunk数: 1
      总Token数: 3722
      压缩比: 2.00x
      多样性得分: 1.000
    
    📄 选择的上下文:
    [1] Anthropic 与 Claude：人工智能安全与大模型演进深度报告 版本日期：2024年...
    
    ================================================================================
    查询: Claude 3.5有什么新功能？
    ================================================================================
    
    省略
    

#### Step 2: 实现成本跟踪与预算控制


```python
import json
from datetime import datetime
from typing import Dict, List
import matplotlib.pyplot as plt

class CostTracker:
    """API调用成本跟踪器"""

    # 主流LLM定价（每1K tokens）
    PRICING = {
        'gpt-4': {'input': 0.03, 'output': 0.06},
        'gpt-3.5-turbo': {'input': 0.001, 'output': 0.002},
        'claude-3': {'input': 0.015, 'output': 0.075},
        'deepseek-chat': {'input': 0.00014, 'output': 0.00028},
        'deepseek-coder': {'input': 0.00014, 'output': 0.00028}
    }

    def __init__(self, budget_limit: float = 10.0):
        self.budget_limit = budget_limit  # 美元
        self.total_spent = 0.0
        self.call_history = []
        self.daily_spending = defaultdict(float)

    def log_api_call(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        query: str
    ):
        """记录一次API调用"""
        if model not in self.PRICING:
            print(f"⚠️ 警告: 未知模型 {model}")
            return

        pricing = self.PRICING[model]
        cost = (
            input_tokens / 1000 * pricing['input'] +
            output_tokens / 1000 * pricing['output']
        )

        self.total_spent += cost

        call_info = {
            'timestamp': datetime.now().isoformat(),
            'model': model,
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'cost': cost,
            'query': query[:100]  # 截断保存
        }

        self.call_history.append(call_info)

        # 按日统计
        date = datetime.now().strftime('%Y-%m-%d')
        self.daily_spending[date] += cost

        # 检查预算
        if self.total_spent > self.budget_limit:
            print(f"⚠️ 警告: 已超出预算限制 ${self.budget_limit:.2f}")

        return cost

    def estimate_query_cost(
        self,
        query: str,
        context_chunks: List[Chunk],
        model: str = 'deepseek-chat'
    ) -> Dict:
        """估算查询成本"""
        if model not in self.PRICING:
            return {'error': f'未知模型: {model}'}

        # 估算token数
        prompt_tokens = 50  # 基础prompt
        query_tokens = len(query)
        context_tokens = sum(len(c.text) for c in context_chunks)
        output_tokens = 100  # 预估输出

        input_tokens = prompt_tokens + query_tokens + context_tokens

        pricing = self.PRICING[model]
        cost = (
            input_tokens / 1000 * pricing['input'] +
            output_tokens / 1000 * pricing['output']
        )

        return {
            'model': model,
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'estimated_cost': cost,
            'cost_breakdown': {
                'prompt': prompt_tokens,
                'query': query_tokens,
                'context': context_tokens,
                'output': output_tokens
            }
        }

    def optimize_for_budget(
        self,
        query: str,
        retrieval_results: List[Tuple[float, Chunk]],
        target_cost: float,
        model: str = 'deepseek-chat'
    ) -> List[Chunk]:
        """在预算约束下优化查询"""
        if model not in self.PRICING:
            return []

        pricing = self.PRICING[model]
        max_input_tokens = int(
            target_cost * 1000 / pricing['input'] - 100  # 预留输出空间
        )

        # 按分数排序
        chunks_sorted = sorted(retrieval_results, key=lambda x: x[0], reverse=True)

        selected_chunks = []
        total_tokens = 50  # prompt + query

        for score, chunk in chunks_sorted:
            chunk_tokens = len(chunk.text)
            if total_tokens + chunk_tokens <= max_input_tokens:
                selected_chunks.append(chunk)
                total_tokens += chunk_tokens
            else:
                break

        return selected_chunks

    def generate_report(self) -> str:
        """生成成本报告"""
        report = f"\n{'='*60}\n"
        report += f"📊 API调用成本报告\n"
        report += f"{'='*60}\n\n"

        report += f"💰 总支出: ${self.total_spent:.4f}\n"
        report += f"💰 预算限制: ${self.budget_limit:.2f}\n"
        report += f"💰 预算使用率: {(self.total_spent/self.budget_limit)*100:.1f}%\n\n"

        report += f"📞 总调用次数: {len(self.call_history)}\n\n"

        # 模型使用统计
        model_usage = {}
        for call in self.call_history:
            model = call['model']
            if model not in model_usage:
                model_usage[model] = {'count': 0, 'cost': 0}
            model_usage[model]['count'] += 1
            model_usage[model]['cost'] += call['cost']

        report += f"📈 模型使用统计:\n"
        for model, stats in sorted(model_usage.items(), key=lambda x: x[1]['cost'], reverse=True):
            report += f"  {model}: {stats['count']}次, ${stats['cost']:.4f}\n"

        report += f"\n📅 每日支出:\n"
        for date, amount in sorted(self.daily_spending.items()):
            report += f"  {date}: ${amount:.4f}\n"

        return report

    def plot_spending(self, save_path: str = 'cost_analysis.png'):
        """绘制支出分析图"""
        if not self.call_history:
            print("⚠️ 没有调用记录")
            return

        # 累积支出
        dates = [call['timestamp'][:10] for call in self.call_history]
        costs = [call['cost'] for call in self.call_history]
        cumulative_costs = np.cumsum(costs)

        fig, axes = plt.subplots(2, 2, figsize=(12, 8))

        # 累积支出趋势
        axes[0,0].plot(range(len(cumulative_costs)), cumulative_costs)
        axes[0,0].set_title('累积支出趋势')
        axes[0,0].set_xlabel('调用次数')
        axes[0,0].set_ylabel('累积成本 ($)')

        # 每次调用成本分布
        axes[0,1].hist(costs, bins=20, edgecolor='black')
        axes[0,1].set_title('单次调用成本分布')
        axes[0,1].set_xlabel('成本 ($)')
        axes[0,1].set_ylabel('频次')

        # 按模型分组的成本
        models = [call['model'] for call in self.call_history]
        unique_models = list(set(models))
        model_costs = [sum(call['cost'] for call in self.call_history if call['model'] == m) for m in unique_models]

        axes[1,0].bar(unique_models, model_costs)
        axes[1,0].set_title('各模型成本')
        axes[1,0].set_xlabel('模型')
        axes[1,0].set_ylabel('总成本 ($)')
        axes[1,0].tick_params(axis='x', rotation=45)

        # 预算使用率
        budget_used = (self.total_spent / self.budget_limit) * 100
        labels = ['已使用', '剩余']
        sizes = [budget_used, 100 - budget_used]
        axes[1,1].pie(sizes, labels=labels, autopct='%1.1f%%')
        axes[1,1].set_title('预算使用率')

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"✅ 成本分析图已保存为 {save_path}")

# 测试成本控制
if __name__ == "__main__":
    tracker = CostTracker(budget_limit=1.0)

    # 模拟API调用
    sample_calls = [
        ('deepseek-chat', 2000, 500, "Anthropic公司介绍"),
        ('gpt-3.5-turbo', 2000, 500, "Claude模型特点"),
        ('deepseek-coder', 2000, 500, "RAG系统原理"),
        ('gpt-4', 2000, 500, "AI安全研究进展"),
        ('claude-3', 2000, 500, "Anthropic融资情况")
    ]

    for model, input_tokens, output_tokens, query in sample_calls:
        cost = tracker.log_api_call(model, input_tokens, output_tokens, query)
        print(f"调用 {model}: ${cost:.4f}")

    # 成本估算
    with open('../Stage_2/anthropic.txt', 'r', encoding='utf-8') as f:
        text = f.read()

    chunker = AdvancedChunker()
    chunks = chunker.chunk_by_recursive(text, 300, 30)

    cost_info = tracker.estimate_query_cost("公司发展历程", chunks[:3])
    print(f"\n💡 查询成本估算: ${cost_info['estimated_cost']:.4f}")
    print(f"   Token分解: {cost_info['cost_breakdown']}")

    # 生成报告
    print(tracker.generate_report())

    # 绘制分析图
    tracker.plot_spending()
```

    调用 deepseek-chat: $0.0004
    调用 gpt-3.5-turbo: $0.0030
    调用 deepseek-coder: $0.0004
    调用 gpt-4: $0.0900
    调用 claude-3: $0.0675
    
    💡 查询成本估算: $0.0006
       Token分解: {'prompt': 50, 'query': 6, 'context': 4325, 'output': 100}
    
    ============================================================
    📊 API调用成本报告
    ============================================================
    
    💰 总支出: $0.1613
    💰 预算限制: $1.00
    💰 预算使用率: 16.1%
    
    📞 总调用次数: 5
    
    📈 模型使用统计:
      gpt-4: 1次, $0.0900
      claude-3: 1次, $0.0675
      gpt-3.5-turbo: 1次, $0.0030
      deepseek-chat: 1次, $0.0004
      deepseek-coder: 1次, $0.0004
    
    📅 每日支出:
      2025-12-08: $0.1613
    
    ✅ 成本分析图已保存为 cost_analysis.png
    
---

## 实验四：实战项目 - 智能投后报告分析助手

### 项目背景

**场景**：投资机构需要分析被投企业的财报和投后报告，回答如"对比A公司和B公司的营收增长率"等复杂问题。

**挑战**：
- 非结构化PDF文档（财报、报告）
- 跨文档查询
- 需要数值计算和对比分析
- 多格式数据（表格、文本、图片）

### 项目实现

#### Step 1: 文档解析与预处理


```python
import os
from typing import List, Dict
from pathlib import Path
import fitz  # PyMuPDF
from unstructured.partition.pdf import partition_pdf

class InvestmentDocumentParser:
    """投资文档解析器"""

    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.extracted_docs = []

    def parse_pdf(self, file_path: str) -> Dict:
        """
        解析PDF文档，提取文本、表格、图片
        """
        doc = fitz.open(file_path)
        result = {
            'filename': os.path.basename(file_path),
            'pages': [],
            'texts': [],
            'tables': [],
            'metadata': doc.metadata
        }

        for page_num in range(len(doc)):
            page = doc[page_num]

            # 提取文本
            text = page.get_text()
            result['texts'].append({
                'page': page_num + 1,
                'content': text,
                'type': 'text'
            })

            # --- 修复部分开始 ---
            # 提取表格（简单方法）
            try:
                tables = page.find_tables()
                # 关键修复：增加 if tables 判断，防止 tables 为 None 时报错
                if tables: 
                    for table in tables:
                        table_data = table.extract()
                        result['tables'].append({
                            'page': page_num + 1,
                            'data': table_data,
                            'type': 'table'
                        })
            except Exception as e:
                print(f"⚠️ 警告: 第 {page_num + 1} 页表格提取失败: {e}")
            # --- 修复部分结束 ---

            # 提取图片
            image_list = page.get_images()
            for img_index, img in enumerate(image_list):
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]

                    result['texts'].append({
                        'page': page_num + 1,
                        'content': f"[图片 {img_index + 1}]",
                        'type': 'image',
                        'image_data': image_bytes
                    })
                except Exception as e:
                    print(f"⚠️ 图片提取警告: {e}")

        doc.close()
        return result

    def process_directory(self) -> List[Dict]:
        """批量处理目录中的所有PDF"""
        pdf_files = list(self.data_dir.glob("*.pdf"))
        print(f"找到 {len(pdf_files)} 个PDF文件")

        for pdf_file in pdf_files:
            print(f"正在处理: {pdf_file.name}")
            doc_info = self.parse_pdf(str(pdf_file))
            self.extracted_docs.append(doc_info)

        print(f"✅ 完成处理，共 {len(self.extracted_docs)} 个文档")
        return self.extracted_docs

    def save_extracted_text(self, output_dir: str):
        """保存提取的文本"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)

        for doc in self.extracted_docs:
            # 保存纯文本
            text_content = "\n".join([
                t['content'] for t in doc['texts']
            ])

            with open(output_path / f"{doc['filename']}.txt", 'w', encoding='utf-8') as f:
                f.write(text_content)

            # 保存表格CSV
            if doc['tables']:
                import pandas as pd
                for i, table in enumerate(doc['tables']):
                    df = pd.DataFrame(table['data'])
                    df.to_csv(output_path / f"{doc['filename']}_table_{i}.csv", index=False, encoding='utf-8')

        print(f"✅ 文本已保存到 {output_path}")
```

#### Step 2: 构建多模态RAG系统


```python
from typing import List, Dict, Tuple
import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

class MultimodalRAG:
    """多模态RAG系统：支持文本和表格"""

    def __init__(self):
        self.text_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.text_chunks = []
        self.table_chunks = []
        self.text_index = None
        self.table_index = None

    def index_texts(self, texts: List[str], metadata: List[Dict] = None):
        """索引文本"""
        if metadata is None:
            metadata = [{}] * len(texts)

        self.text_chunks = [
            {
                'text': text,
                'metadata': meta,
                'type': 'text'
            }
            for text, meta in zip(texts, metadata)
        ]

        embeddings = self.text_model.encode(texts)
        self.text_index = faiss.IndexFlatIP(embeddings.shape[1])
        self.text_index.add(embeddings.astype('float32'))

        print(f"✅ 已索引 {len(texts)} 个文本块")

    def index_tables(self, table_files: List[str]):
        """索引表格"""
        table_texts = []
        table_metadata = []

        for file_path in table_files:
            df = pd.read_csv(file_path)
            # 将表格转换为文本描述
            table_text = self._table_to_text(df, file_path)
            table_texts.append(table_text)
            table_metadata.append({
                'type': 'table',
                'file': file_path,
                'shape': df.shape
            })

        self.table_chunks = [
            {'text': text, 'metadata': meta, 'type': 'table'}
            for text, meta in zip(table_texts, table_metadata)
        ]

        # 索引表格文本
        embeddings = self.text_model.encode(table_texts)
        self.table_index = faiss.IndexFlatIP(embeddings.shape[1])
        self.table_index.add(embeddings.astype('float32'))

        print(f"✅ 已索引 {len(table_texts)} 个表格")

    def _table_to_text(self, df: pd.DataFrame, filename: str) -> str:
        """将表格转换为文本描述"""
        # 生成表格的文本表示
        text_parts = [f"表格文件: {filename}"]

        # 添加表头
        text_parts.append(f"列名: {', '.join(df.columns.tolist())}")

        # 添加前几行数据
        text_parts.append("数据预览:")
        for i, row in df.head(10).iterrows():
            row_text = ", ".join([f"{col}: {val}" for col, val in row.items()])
            text_parts.append(row_text)

        return "\n".join(text_parts)

    def hybrid_search(
        self,
        query: str,
        k: int = 5,
        text_weight: float = 0.7,
        table_weight: float = 0.3
    ) -> List[Dict]:
        """混合检索：文本 + 表格"""
        query_embedding = self.text_model.encode([query])[0]

        results = []

        # 文本检索
        if self.text_index:
            text_scores, text_indices = self.text_index.search(
                query_embedding.reshape(1, -1).astype('float32'),
                k
            )
            for score, idx in zip(text_scores[0], text_indices[0]):
                results.append({
                    'chunk': self.text_chunks[idx],
                    'score': score * text_weight,
                    'source': 'text'
                })

        # 表格检索
        if self.table_index:
            table_scores, table_indices = self.table_index.search(
                query_embedding.reshape(1, -1).astype('float32'),
                k
            )
            for score, idx in zip(table_scores[0], table_indices[0]):
                results.append({
                    'chunk': self.table_chunks[idx],
                    'score': score * table_weight,
                    'source': 'table'
                })

        # 按分数排序
        results.sort(key=lambda x: x['score'], reverse=True)

        return results[:k]

    def analyze_company_comparison(
        self,
        query: str,
        company_a: str,
        company_b: str
    ) -> Dict:
        """分析两家公司对比"""
        # 检索相关文档
        results = self.hybrid_search(query, k=10)

        # 提取两家公司的信息
        company_a_info = []
        company_b_info = []

        for result in results:
            text = result['chunk']['text'].lower()
            if company_a.lower() in text:
                company_a_info.append(result)
            elif company_b.lower() in text:
                company_b_info.append(result)

        # 生成对比报告
        report = self._generate_comparison_report(
            query, company_a, company_b,
            company_a_info, company_b_info
        )

        return {
            'query': query,
            'company_a': company_a,
            'company_b': company_b,
            'company_a_results': company_a_info,
            'company_b_results': company_b_info,
            'comparison_report': report
        }

    def _generate_comparison_report(
        self,
        query: str,
        company_a: str,
        company_b: str,
        info_a: List,
        info_b: List
    ) -> str:
        """生成对比报告"""
        report = f"📊 {company_a} vs {company_b} 对比分析\n"
        report += f"查询: {query}\n\n"

        report += f"【{company_a}】\n"
        if info_a:
            for result in info_a:
                report += f"- {result['chunk']['text'][:200]}...\n"
        else:
            report += "- 未找到相关信息\n"

        report += f"\n【{company_b}】\n"
        if info_b:
            for result in info_b:
                report += f"- {result['chunk']['text'][:200]}...\n"
        else:
            report += "- 未找到相关信息\n"

        report += "\n建议: 手动查看检索到的文档以获取详细数据"

        return report

# 主程序
if __name__ == "__main__":
    # 示例使用
    parser = InvestmentDocumentParser("C:\\Users\\Admin\\Desktop\\code\\Live_And_Learn\\Agent_Learning\\Stage_3")
    docs = parser.process_directory()
    parser.save_extracted_text("extracted_texts")

    # 获取提取的文本文件
    text_files = list(Path("extracted_texts").glob("*.txt"))
    table_files = list(Path("extracted_texts").glob("*.csv"))

    # 构建RAG
    rag = MultimodalRAG()
    rag.index_texts([open(f, 'r', encoding='utf-8').read() for f in text_files[:10]])
    rag.index_tables(table_files)

    # 测试对比查询
    comparison = rag.analyze_company_comparison(
        "营收增长率",
        "阿里",
        "腾讯"
    )

    print(comparison['comparison_report'])
```

    找到 3 个PDF文件
    正在处理: albb.pdf
    正在处理: anthropic.pdf
    find_tables: exception occurred: code=4: no font file for digest
    正在处理: tencent.pdf
    ✅ 完成处理，共 3 个文档
    ✅ 文本已保存到 extracted_texts
    ✅ 已索引 3 个文本块
    ✅ 已索引 34 个表格
    📊 阿里 vs 腾讯 对比分析
    查询: 营收增长率
    
    省略

    建议: 手动查看检索到的文档以获取详细数据
    
