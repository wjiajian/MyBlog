> **核心理念**：先手动造轮子（去框架化），深度理解数据流转全流程，再谈工程优化。

---

## 实验目标
1. **完全脱离框架**，从零搭建一个可工作的 RAG 系统
2. **理解数据流转链路**：Text → Embedding → Vector Store → Retrieval → Prompt → Generation
3. **掌握核心组件**：Embedding模型、向量数据库、LLM API调用
4. **培养问题定位能力**：当检索效果不佳时，能分析是哪个环节出了问题

---

## 实验环境准备

### 安装依赖

```bash
# 创建虚拟环境（推荐）

# 安装核心依赖
pip install sentence-transformers
pip install faiss-cpu  # 或 pip install faiss-gpu (如果有GPU)
pip install openai
pip install numpy
pip install pandas
```

### 环境测试
```python
import sentence_transformers
import faiss
import numpy as np
print("✅ 环境测试通过！")
print(f"sentence-transformers 版本: {sentence_transformers.__version__}")
print(f"FAISS 版本: {faiss.__version__}")
print(f"NumPy 版本: {np.__version__}")
```

    ✅ 环境测试通过！
    sentence-transformers 版本: 5.1.2
    FAISS 版本: 1.13.0
    NumPy 版本: 2.2.5
    

## 实验一：数据切分与向量化

## 实验目标：
将文档切分成可管理的文本块（Chunks），并转换为向量表示。

### 理论基础

#### 1. 为什么要切分？
- **上下文窗口限制**：LLM的输入有长度限制（GPT-4约32K tokens，Claude约200K tokens）
- **检索效率**：小块更容易找到精确匹配
- **成本控制**：小块减少token数量，降低API调用成本

#### 2. 切分策略
| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 固定长度 | 简单快速 | 可能切断语义 | 日志、代码 |
| 语义切分 | 保持语义完整 | 实现复杂 | 文档、论文 |
| 递归切分 | 平衡速度与质量 | 需要调参 | 通用场景 |

### 实验步骤

#### Step 1: 基础文本切分


```python
def chunk_text_fixed_length(text, chunk_size=200, overlap=20):
    """
    固定长度切分，带重叠窗口
    :param text: 输入文本
    :param chunk_size: 每块字符数
    :param overlap: 重叠字符数
    :return: 文本块列表
    """
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)

        # 下一块从 end-overlap 开始
        start = end - overlap

        # 防止无限循环
        if start >= len(text):
            break

        if start <= 0:  # 处理极短文本
            break

    return chunks

# 测试
sample_text = """
人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，
它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。
包括机器人、语言识别、图像识别、自然语言处理和专家系统等。
人工智能的核心问题包括建构能够表现出与人类智能相关的能力，
如推理、学习和解决问题的能力。机器学习是人工智能的一个分支，
它使用统计技术让计算机从数据中"学习"，而不需要明确编程。
深度学习是机器学习的子集，它使用多层神经网络来模拟人类大脑的学习过程。
"""

chunks = chunk_text_fixed_length(sample_text, chunk_size=100, overlap=20)
print(f"原始文本长度: {len(sample_text)}")
print(f"切分成 {len(chunks)} 个片段:")
for i, chunk in enumerate(chunks):
    print(f"\n--- 片段 {i+1} ---")
    print(f"长度: {len(chunk)}")
    print(chunk)
```

    原始文本长度: 244
    切分成 4 个片段:
    
    --- 片段 1 ---
    长度: 100
    
    人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，
    它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。
    包括机器人、语言识别、图像
    
    --- 片段 2 ---
    长度: 100
    的智能机器。
    包括机器人、语言识别、图像识别、自然语言处理和专家系统等。
    人工智能的核心问题包括建构能够表现出与人类智能相关的能力，
    如推理、学习和解决问题的能力。机器学习是人工智能的一个分支，
    它使
    
    --- 片段 3 ---
    长度: 84
    力。机器学习是人工智能的一个分支，
    它使用统计技术让计算机从数据中"学习"，而不需要明确编程。
    深度学习是机器学习的子集，它使用多层神经网络来模拟人类大脑的学习过程。
    
    
    --- 片段 4 ---
    长度: 4
    过程。
    
    

**Step 2**: 高级语义切分（进阶）


```python
import re

def chunk_text_sentence_aware(text, max_chars=200, max_sentences=3):
    """
    基于句子的智能切分
    :param text: 输入文本
    :param max_chars: 最大字符数
    :param max_sentences: 最大句子数
    :return: 文本块列表
    """
    # 按句子分割（使用更智能的正则）
    sentences = re.split(r'[。！？.!?]\s*', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        # 如果加上这个句子会超出限制，且当前chunk不为空
        if len(current_chunk + sentence) > max_chars and current_chunk:
            chunks.append(current_chunk)
            current_chunk = sentence
        else:
            if current_chunk:
                current_chunk += "。" + sentence
            else:
                current_chunk = sentence

        # 如果chunk中的句子数已经达到上限
        if current_chunk.count('。') + current_chunk.count('!') + current_chunk.count('?') >= max_sentences:
            chunks.append(current_chunk)
            current_chunk = ""

    # 添加最后一个chunk
    if current_chunk:
        chunks.append(current_chunk)

    return chunks

# 测试
chunks = chunk_text_sentence_aware(sample_text, max_chars=150)
print(f"语义切分成 {len(chunks)} 个片段")
for i, chunk in enumerate(chunks):
    print(f"\n--- 片段 {i+1} ---")
    print(chunk)
```

    语义切分成 2 个片段
    
    --- 片段 1 ---
    人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，
    它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。包括机器人、语言识别、图像识别、自然语言处理和专家系统等
    
    --- 片段 2 ---
    人工智能的核心问题包括建构能够表现出与人类智能相关的能力，
    如推理、学习和解决问题的能力。机器学习是人工智能的一个分支，
    它使用统计技术让计算机从数据中"学习"，而不需要明确编程。深度学习是机器学习的子集，它使用多层神经网络来模拟人类大脑的学习过程
    

**Step 3**: 文本向量化


```python
# experiment_1_embedding.py
from sentence_transformers import SentenceTransformer
import numpy as np

# 加载预训练模型
model = SentenceTransformer('all-MiniLM-L6-v2')

def embed_chunks(chunks):
    """
    将文本块转换为向量
    :param chunks: 文本块列表
    :return: 向量数组 (numpy array)
    """
    embeddings = model.encode(chunks)
    return embeddings

# 实验
chunks = chunk_text_fixed_length(sample_text, chunk_size=100, overlap=20)
embeddings = embed_chunks(chunks)

print(f"文本块数量: {len(chunks)}")
print(f"向量维度: {embeddings.shape}")  # 应该是 (chunk_count, 384)
print(f"向量类型: {type(embeddings)}")

# 查看第一个向量的前5个维度
print(f"\n第一个向量 (前5维): {embeddings[0][:5]}")
```

    文本块数量: 4
    向量维度: (4, 384)
    向量类型: <class 'numpy.ndarray'>
    
    第一个向量 (前5维): [ 0.01680778  0.04001119 -0.03224989 -0.01100226 -0.02571571]
    

### 实验一练习题

1. **动手实践**：将《西游记》前三回内容（可以从网络获取txt文件）切分成200字符的块，重叠50字符，统计切分结果。


```python
import os

def chunk_xyj_fixed_length(text, chunk_size=200, overlap=50):
    """
    固定长度切分，带重叠窗口
    :param text: 输入文本
    :param chunk_size: 每块字符数
    :param overlap: 重叠字符数
    :return: 文本块列表
    """
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)

        # 下一块从 end-overlap 开始
        start = end - overlap

        # 防止无限循环
        if start >= len(text):
            break

        if start <= 0:  # 处理极短文本
            break

    return chunks


# 读取《西游记》,文档已经提前将前三回的内容拆出来了
with open('xyj.txt', 'r', encoding='utf-8') as f:
    sample_text = ''.join(f.readlines())


chunks = chunk_text_fixed_length(sample_text, chunk_size=100, overlap=20)
print(f"原始文本长度: {len(sample_text)}")
print(f"切分成 {len(chunks)} 个片段:")
for i, chunk in enumerate(chunks):
    print(f"\n--- 片段 {i+1} ---")
    print(f"长度: {len(chunk)}")
    print(chunk)
```

    原始文本长度: 22856
    切分成 286 个片段:
    
    --- 片段 1 ---
    长度: 100
    ========简介========
    《西游记》是一部中国古典神魔小说，为中国“四大名著”之一。书中讲述唐朝法师西天取经的故事，表现了惩恶扬善的古老主题。《西游记》成书于16世纪明朝中叶，自问世以来在
    
    --- 片段 2 ---
    长度: 100
    记》成书于16世纪明朝中叶，自问世以来在中国及世界各地广为流传，被翻译成多种语言。西游记是中国古典四大名著之一，是最优秀的神话小说，也是一部群众创作和文人创作相结合的作品。小说以整整七回的“大闹天宫”
    。
    。
    --- 片段 286 ---
    长度: 56
    </p><p>  高迁上品天仙位，名列云班宝录中。</p><p>  毕竟不知授个甚么官爵，且听下回分解。</p>
    

2. **对比实验**：使用固定长度切分和语义切分对比，分析哪个在保持语义完整性方面更好。


```python
# 使用语义切分
import re

def chunk_text_sentence_aware(text, max_chars=200, max_sentences=3):
    """
    基于句子的智能切分
    :param text: 输入文本
    :param max_chars: 最大字符数
    :param max_sentences: 最大句子数
    :return: 文本块列表
    """
    # 按句子分割（使用更智能的正则）
    sentences = re.split(r'[。！？.!?]\s*', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        # 如果加上这个句子会超出限制，且当前chunk不为空
        if len(current_chunk + sentence) > max_chars and current_chunk:
            chunks.append(current_chunk)
            current_chunk = sentence
        else:
            if current_chunk:
                current_chunk += "。" + sentence
            else:
                current_chunk = sentence

        # 如果chunk中的句子数已经达到上限
        if current_chunk.count('。') + current_chunk.count('!') + current_chunk.count('?') >= max_sentences:
            chunks.append(current_chunk)
            current_chunk = ""

    # 添加最后一个chunk
    if current_chunk:
        chunks.append(current_chunk)

    return chunks

# 测试
chunks = chunk_text_sentence_aware(sample_text, max_chars=150)
print(f"语义切分成 {len(chunks)} 个片段")
for i, chunk in enumerate(chunks):
    print(f"\n--- 片段 {i+1} ---")
    print(chunk)
```

    语义切分成 254 个片段
    
    --- 片段 1 ---
    ========简介========
    《西游记》是一部中国古典神魔小说，为中国“四大名著”之一。书中讲述唐朝法师西天取经的故事，表现了惩恶扬善的古老主题。《西游记》成书于16世纪明朝中叶，自问世以来在中国及世界各地广为流传，被翻译成多种语言
    
    --- 片段 2 ---
    西游记是中国古典四大名著之一，是最优秀的神话小说，也是一部群众创作和文人创作相结合的作品。小说以整整七回的“大闹天宫”故事开始，把孙悟空的形象提到全书首要的地位。第八至十二回写如来说法，观音访僧，魏徵斩龙，唐僧出世等故事，交待取经的缘起
    
    --- 片段 3 ---
    从十四回到全书结束，写孙悟空被迫皈依佛教，保护唐僧取经，在八戒、沙僧协助下，一路斩妖除魔，到西天成了“正果”。在中国，乃至亚洲部分地区西游记家喻户晓，其中孙悟空、唐僧、猪八戒、沙僧等人物和“大闹天宫”、“三打白骨精”、“火焰山”等故事尤其为人熟悉
    。
    。
    --- 片段 254 ---
    这猴王与金星纵起云头，升在空霄之上，正是那：</p><p>  高迁上品天仙位，名列云班宝录中。</p><p>  毕竟不知授个甚么官爵，且听下回分解。</p>
    

可以发现语义切分在保持语义完整性方面更好。
> 这不是废话吗qwq

3. **思考题**：如果chunk_size设置过大（如2000字符），会导致什么问题？过小（如50字符）又会导致什么问题？
 - chunk_size过大：检索相关性降低，可能包含过多无关信息，导致LLM难以聚焦，且增加API调用成本。
 - chunk_size过小：上下文信息丢失，语义不完整，检索结果碎片化，可能影响回答准确性，但检索速度更快、内存占用更低。
 - 需要根据实际场景权衡检索质量、性能和成本，合理设置chunk_size和overlap参数。

## 实验二：向量存储与检索

### 实验目标：
将向量存储到数据库，实现高效的相似度搜索。

### 理论基础

#### 1. 向量数据库 vs 传统数据库

| 特性 | 传统数据库 | 向量数据库 |
|------|-----------|-----------|
| 索引类型 | B-Tree, Hash | HNSW, IVF, LSH |
| 查询方式 | 精确匹配 | 相似度计算 |
| 距离度量 | =, >, < | 余弦相似度、欧氏距离 |
| 应用场景 | 结构化数据 | 文本、图像、音频等非结构化数据 |

#### 2. 距离度量
- **余弦相似度 (Cosine Similarity)**：最常用，关注角度而非绝对值
- **欧氏距离 (Euclidean Distance)**：关注绝对差值
- **点积 (Dot Product)**：计算速度快，介于两者之间

### 实验步骤

#### Step 1: 使用 Faiss 构建简单向量数据库


```python
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

class SimpleVectorDB:
    def __init__(self, dimension):
        """
        初始化向量数据库
        :param dimension: 向量维度
        """
        self.dimension = dimension
        # 创建FAISS索引 (L2距离，余弦相似度=1-距离)
        self.index = faiss.IndexFlatL2(dimension)
        # 存储原始文本块
        self.texts = []

    def add_vectors(self, vectors, texts):
        """
        添加向量和文本
        :param vectors: numpy array of vectors
        :param texts: 对应的文本列表
        """
        # 确保向量是float32类型
        vectors = np.array(vectors).astype('float32')
        # 添加到索引
        self.index.add(vectors)
        self.texts.extend(texts)

    def search(self, query_vector, k=3):
        """
        搜索最相似的k个向量
        :param query_vector: 查询向量 (numpy array)
        :param k: 返回top-k结果
        :return: ( distances, indices, texts )
        """
        query_vector = np.array([query_vector]).astype('float32')

        # 搜索
        distances, indices = self.index.search(query_vector, k)

        # 获取对应的文本
        retrieved_texts = [self.texts[idx] for idx in indices[0]]

        return distances[0], indices[0], retrieved_texts

# 实验
model = SentenceTransformer('all-MiniLM-L6-v2')

# 准备数据
documents = [
    "人工智能是计算机科学的重要分支",
    "深度学习使用多层神经网络",
    "机器学习是人工智能的子集",
    "Python是一种编程语言",
    "大数据需要高效的数据处理技术"
]

# 向量化
embeddings = model.encode(documents)

# 构建数据库
vector_db = SimpleVectorDB(dimension=embeddings.shape[1])
vector_db.add_vectors(embeddings, documents)

# 模拟用户查询
query = "什么是深度学习？"
query_embedding = model.encode([query])

# 搜索
distances, indices, retrieved_texts = vector_db.search(query_embedding[0], k=3)

print(f"查询: {query}")
print(f"\nTop-3 检索结果:")
for i, (dist, text) in enumerate(zip(distances, retrieved_texts)):
    # 转换为相似度分数 (0-1, 1为完全相似)
    similarity = 1 / (1 + dist)
    print(f"\n结果 {i+1}:")
    print(f"  相似度分数: {similarity:.4f}")
    print(f"  距离: {dist:.4f}")
    print(f"  文本: {text}")
```

    查询: 什么是深度学习？
    
    Top-3 检索结果:
    
    结果 1:
      相似度分数: 0.6253
      距离: 0.5991
      文本: 机器学习是人工智能的子集
    
    结果 2:
      相似度分数: 0.6068
      距离: 0.6480
      文本: 深度学习使用多层神经网络
    
    结果 3:
      相似度分数: 0.5897
      距离: 0.6957
      文本: 人工智能是计算机科学的重要分支
    

#### Step 2: 性能对比实验


```python
import time
import matplotlib.pyplot as plt

class PerformanceBenchmark:
    def __init__(self, vector_db):
        self.vector_db = vector_db

    def benchmark_search(self, query_embeddings, k=5):
        """
        基准测试检索性能
        """
        latencies = []

        for query_emb in query_embeddings:
            start_time = time.time()
            distances, indices, texts = self.vector_db.search(query_emb, k=k)
            end_time = time.time()

            latency = (end_time - start_time) * 1000  # 转换为毫秒
            latencies.append(latency)

        avg_latency = np.mean(latencies)
        p95_latency = np.percentile(latencies, 95)
        p99_latency = np.percentile(latencies, 99)

        return {
            'avg_latency_ms': avg_latency,
            'p95_latency_ms': p95_latency,
            'p99_latency_ms': p99_latency,
            'min_latency_ms': min(latencies),
            'max_latency_ms': max(latencies)
        }

# 生成测试数据
test_queries = ["人工智能发展", "机器学习算法", "深度神经网络", "Python编程"] * 10  # 40个查询
test_embeddings = model.encode(test_queries)

# 基准测试
benchmark = PerformanceBenchmark(vector_db)
results = benchmark.benchmark_search(test_embeddings, k=5)

print("=== 检索性能基准测试 ===")
print(f"平均延迟: {results['avg_latency_ms']:.2f} ms")
print(f"P95 延迟: {results['p95_latency_ms']:.2f} ms")
print(f"P99 延迟: {results['p99_latency_ms']:.2f} ms")
print(f"最小延迟: {results['min_latency_ms']:.2f} ms")
print(f"最大延迟: {results['max_latency_ms']:.2f} ms")
```

    === 检索性能基准测试 ===
    平均延迟: 0.02 ms
    P95 延迟: 0.00 ms
    P99 延迟: 0.61 ms
    最小延迟: 0.00 ms
    最大延迟: 1.00 ms
    

### 实验二练习题

1. **数据规模实验**：分别存储100、1000、10000个文档，测试检索延迟的变化趋势。

2. **Top-K 实验**：对同一个查询，分别设置k=1, 3, 5, 10，分析结果质量的变化。

3. **检索质量评估**：手动准备10个问题和标准答案，测试你的向量数据库能否返回正确内容。


```python
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class SimpleVectorDB:
    def __init__(self, dimension):
        """
        初始化向量数据库
        :param dimension: 向量维度
        """
        self.dimension = dimension
        # 创建FAISS索引 (L2距离，余弦相似度=1-距离)
        self.index = faiss.IndexFlatL2(dimension)
        # 存储原始文本块
        self.texts = []

    def add_vectors(self, vectors, texts):
        """
        添加向量和文本
        :param vectors: numpy array of vectors
        :param texts: 对应的文本列表
        """
        # 确保向量是float32类型
        vectors = np.array(vectors).astype('float32')
        # 添加到索引
        self.index.add(vectors)
        self.texts.extend(texts)

    def search(self, query_vector, k=3):
        """
        搜索最相似的k个向量
        :param query_vector: 查询向量 (numpy array)
        :param k: 返回top-k结果
        :return: ( distances, indices, texts )
        """
        query_vector = np.array([query_vector]).astype('float32')

        # 搜索
        distances, indices = self.index.search(query_vector, k)

        # 获取对应的文本
        retrieved_texts = [self.texts[idx] for idx in indices[0]]

        return distances[0], indices[0], retrieved_texts

# 实验
model = SentenceTransformer('all-MiniLM-L6-v2')

# 准备数据
with open('anthropic.txt', 'r', encoding='utf-8') as f:
    anthropic = ''.join(f.readlines())
documents = anthropic.split('\n')  # 使用 Anthropic 百科文本进行实验 

# 向量化
embeddings = model.encode(documents)

# 构建数据库
vector_db = SimpleVectorDB(dimension=embeddings.shape[1])
vector_db.add_vectors(embeddings, documents)

# 模拟用户查询
query = "Claude是哪个公司开发的？"
query_embedding = model.encode([query])

# 搜索
distances, indices, retrieved_texts = vector_db.search(query_embedding[0], k=3)

print(f"查询: {query}")
print(f"\nTop-3 检索结果:")
for i, (dist, text) in enumerate(zip(distances, retrieved_texts)):
    # 转换为相似度分数 (0-1, 1为完全相似)
    similarity = 1 / (1 + dist)
    print(f"\n结果 {i+1}:")
    print(f"  相似度分数: {similarity:.4f}")
    print(f"  距离: {dist:.4f}")
    print(f"  文本: {text}")
    
print("\n--------------------------------\n")
# 模拟用户查询
query2 = "Anthropic创始人是谁？"
query_embedding2 = model.encode([query2])

# 搜索
distances, indices, retrieved_texts = vector_db.search(query_embedding2[0], k=3)

print(f"查询: {query2}")
print(f"\nTop-3 检索结果:")
for i, (dist, text) in enumerate(zip(distances, retrieved_texts)):
    # 转换为相似度分数 (0-1, 1为完全相似)
    similarity = 1 / (1 + dist)
    print(f"\n结果 {i+1}:")
    print(f"  相似度分数: {similarity:.4f}")
    print(f"  距离: {dist:.4f}")
    print(f"  文本: {text}")
```

    查询: Claude是哪个公司开发的？
    
    Top-3 检索结果:
    
    结果 1:
      相似度分数: 0.6002
      距离: 0.6662
      文本: Anthropic是一家位于美国加州旧金山的人工智能股份有限公司， 成立于2021年。 该公司由达里奥·阿莫迪 和丹妮拉·阿莫迪兄妹创立， 现任首席执行官达里奥·阿莫迪。 是一家人工智能安全和研究公司，致力于构建可靠、可解释和可操纵的AI系统。 Anthropic公司开发了聊天机器人Claude，提出的“宪法AI原则”。 
    
    结果 2:
      相似度分数: 0.4727
      距离: 1.1155
      文本: 2021年，Anthropic成立。2021年5月，Anthropic获得1.24亿美元A轮融资，由Skype联合创始人Jaan Tallinn领投，Facebook联合创始人Dustin Moskovitz等投资者参与。 2022年4月29日，Anthropic在B轮融资中筹集了5.8亿美元，领投者为FTX 首席执行官 Sam Bankman-Fried。 2023年2月，获得Google投资3亿美元，Google持股10%。 2023年7月11日，Anthropic 发布了全新的 Claude 2 大语言模型。 2024年3月4日消息，Anthropic发布Claude 3模型家族。 2024年10月22日，美国人工智能初创公司Anthropic宣布推出升级版的Claude 3.5 Sonnet模型，升级后的Claude 3.5大语言模型，Anthropic声称会达到“仿佛一个人在电脑前工作”的效果。 2025年2月25日，Anthropic宣布推出Claude 3.7 Sonnet，称这是其迄今为止最智能的模型，也是市场上首款混合推理模型；当地时间11月24日，Anthropic正式发布其最新模型Claude Opus 4.5。 
    
    结果 3:
      相似度分数: 0.4151
      距离: 1.4090
      文本: 2023年4月，Anthropic入选福布斯AI 50榜单。 2023年8月，入选福布斯发布2023云计算100强榜单名列73位。 2024年4月16日，入选《2024福布斯AI 50榜单》排名4位。 2025年4月，入选《2025福布斯AI 50榜单》。
    
    --------------------------------
    
    查询: Anthropic创始人是谁？
    
    Top-3 检索结果:
    
    结果 1:
      相似度分数: 0.4567
      距离: 1.1897
      文本: 2023年4月，Anthropic入选福布斯AI 50榜单。 2023年8月，入选福布斯发布2023云计算100强榜单名列73位。 2024年4月16日，入选《2024福布斯AI 50榜单》排名4位。 2025年4月，入选《2025福布斯AI 50榜单》。
    
    结果 2:
      相似度分数: 0.4469
      距离: 1.2377
      文本: 2021年，Anthropic成立。2021年5月，Anthropic获得1.24亿美元A轮融资，由Skype联合创始人Jaan Tallinn领投，Facebook联合创始人Dustin Moskovitz等投资者参与。 2022年4月29日，Anthropic在B轮融资中筹集了5.8亿美元，领投者为FTX 首席执行官 Sam Bankman-Fried。 2023年2月，获得Google投资3亿美元，Google持股10%。 2023年7月11日，Anthropic 发布了全新的 Claude 2 大语言模型。 2024年3月4日消息，Anthropic发布Claude 3模型家族。 2024年10月22日，美国人工智能初创公司Anthropic宣布推出升级版的Claude 3.5 Sonnet模型，升级后的Claude 3.5大语言模型，Anthropic声称会达到“仿佛一个人在电脑前工作”的效果。 2025年2月25日，Anthropic宣布推出Claude 3.7 Sonnet，称这是其迄今为止最智能的模型，也是市场上首款混合推理模型；当地时间11月24日，Anthropic正式发布其最新模型Claude Opus 4.5。 
    
    结果 3:
      相似度分数: 0.4362
      距离: 1.2923
      文本: Anthropic是一家位于美国加州旧金山的人工智能股份有限公司， 成立于2021年。 该公司由达里奥·阿莫迪 和丹妮拉·阿莫迪兄妹创立， 现任首席执行官达里奥·阿莫迪。 是一家人工智能安全和研究公司，致力于构建可靠、可解释和可操纵的AI系统。 Anthropic公司开发了聊天机器人Claude，提出的“宪法AI原则”。 
    

## 实验三：Prompt 拼接与答案生成

### 实验目标
将检索到的内容与用户问题拼接，构建完整的Prompt发送给LLM。

### 理论基础

#### Prompt 工程核心原则
1. **明确性**：清晰指定角色和任务
2. **结构化**：使用格式化的模板
3. **约束性**：限制回答范围在检索内容内
4. **示例驱动**：提供Few-shot示例

#### 典型 RAG Prompt 模板

```
你是一个专业的问答助手。请基于提供的上下文信息回答用户问题。

上下文信息：
{context}

用户问题：{question}

回答要求：
1. 仅基于上下文信息回答，不要添加上下文外的信息
2. 如果上下文信息不足以回答问题，请明确说明
3. 回答要简洁、准确、有条理
4. 如果涉及数字或事实，请确保准确性

回答：
```

### 实验步骤

#### Step 1: 基础 Prompt 拼接


```python
from openai import OpenAI
import os

# 设置API Key（需要您自己的API Key，本例子使用deepseek）
# os.environ['API_KEY'] = 'your-api-key-here'

class SimpleVectorDB:
    def __init__(self, dimension):
        """
        初始化向量数据库
        :param dimension: 向量维度
        """
        self.dimension = dimension
        # 创建FAISS索引 (L2距离，余弦相似度=1-距离)
        self.index = faiss.IndexFlatL2(dimension)
        # 存储原始文本块
        self.texts = []

    def add_vectors(self, vectors, texts):
        """
        添加向量和文本
        :param vectors: numpy array of vectors
        :param texts: 对应的文本列表
        """
        # 确保向量是float32类型
        vectors = np.array(vectors).astype('float32')
        # 添加到索引
        self.index.add(vectors)
        self.texts.extend(texts)

    def search(self, query_vector, k=3):
        """
        搜索最相似的k个向量
        :param query_vector: 查询向量 (numpy array)
        :param k: 返回top-k结果
        :return: ( distances, indices, texts )
        """
        query_vector = np.array([query_vector]).astype('float32')

        # 搜索
        distances, indices = self.index.search(query_vector, k)

        # 获取对应的文本
        retrieved_texts = [self.texts[idx] for idx in indices[0]]

        return distances[0], indices[0], retrieved_texts


class SimpleRAG:
    def __init__(self, vector_db, model_name="deepseek-chat"):
        self.vector_db = vector_db
        self.model_name = model_name
        # 使用本地模型替代（如果无法访问OpenAI API）
        self.use_local = False
        self.local_model = SentenceTransformer('all-MiniLM-L6-v2')

    def build_prompt(self, query, retrieved_texts, max_context_length=2000):
        """
        构建 RAG Prompt
        :param query: 用户问题
        :param retrieved_texts: 检索到的文本列表
        :param max_context_length: 最大上下文长度（字符）
        :return: 完整的Prompt
        """
        # 拼接上下文
        context = ",".join(retrieved_texts)

        # 限制上下文长度
        if len(context) > max_context_length:
            context = context[:max_context_length]

        prompt = f"""你是一个专业的问答助手。请基于提供的上下文信息回答用户问题。
                    上下文信息：{context}
                    用户问题：{query}
                    回答要求：
                    1. 仅基于上下文信息回答，不要添加上下文外的信息
                    2. 如果上下文信息不足以回答问题，请明确说明
                    3. 回答要简洁、准确、有条理
                    4. 如果涉及数字或事实，请确保准确性
                    回答：
                """

        return prompt

    def call_llm(self, prompt):
        """
        调用 LLM 生成回答
        """
        if self.use_local:
            # 使用简单规则引擎模拟LLM回答（仅用于测试）
            return self.simple_rule_based_answer(prompt)
        else:
            # 调用 DeepSeek API
            client = OpenAI(
                api_key=os.getenv('DEEPSEEK_API'),
                base_url="https://api.deepseek.com/v1"  # DeepSeek API 端点
            )

            response = client.chat.completions.create(
                model="deepseek-chat",  # 例如 "deepseek-chat"
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content

    def simple_rule_based_answer(self, prompt):
        """
        简单的基于规则的问答（仅用于测试环境）
        实际生产环境应使用真正的 LLM
        """
        # 提取问题和上下文
        lines = prompt.split('\n')
        question = ""
        context = ""

        in_question = False
        in_context = False

        for line in lines:
            if "用户问题：" in line:
                in_question = True
                in_context = False
                question = line.replace("用户问题：", "").strip()
            elif "上下文信息：" in line:
                in_context = True
                in_question = False
            elif line.startswith("回答："):
                break
            elif in_context:
                context += line + "\n"

        
        for keyword, answer in keywords.items():
            if keyword in question or keyword in context:
                return f"基于上下文信息，{answer}"

        return "抱歉，基于提供的上下文信息，我无法回答这个问题。"

    def query(self, question, k=3):
        """
        完整的RAG查询流程
        """
        # 1. 向量化问题
        query_embedding = self.local_model.encode([question])[0]

        # 2. 检索相关内容
        distances, indices, retrieved_texts = self.vector_db.search(query_embedding, k=k)

        # 3. 构建Prompt
        prompt = self.build_prompt(question, retrieved_texts)

        # 4. 生成回答
        answer = self.call_llm(prompt)

        return {
            'question': question,
            'retrieved_texts': retrieved_texts,
            'distances': distances.tolist(),
            'prompt': prompt,
            'answer': answer
        }

# 简单的关键词匹配回答

documents = [
    "人工智能是计算机科学的重要分支",
    "深度学习使用多层神经网络",
    "机器学习是人工智能的子集",
    "Python是一种编程语言",
    "大数据需要高效的数据处理技术"
]

keywords = {
    "人工智能": "人工智能是计算机科学的重要分支，它企图了解智能的实质。",
    "机器学习": "机器学习是人工智能的一个分支，使用统计技术让计算机从数据中学习。",
    "深度学习": "深度学习是机器学习的子集，使用多层神经网络模拟人脑学习。",
    "Python": "Python是一种高级编程语言，广泛用于数据科学和AI领域。"
}

# 向量化
embeddings = model.encode(documents)

# 构建数据库
vector_db = SimpleVectorDB(dimension=embeddings.shape[1])
vector_db.add_vectors(embeddings, documents)

# 实验
rag = SimpleRAG(vector_db)

# 测试查询
query = "人工智能包括哪些分支？"
result = rag.query(query, k=2)

print(f"=" * 80)
print(f"用户问题: {result['question']}")
print(f"=" * 80)
print(f"\n检索到的文档:")
for i, (text, dist) in enumerate(zip(result['retrieved_texts'], result['distances'])):
    similarity = 1 / (1 + dist)
    print(f"\n文档 {i+1} (相似度: {similarity:.4f}):")
    print(f"  {text}")

print(f"\n" + "=" * 80)
print(f"生成的Prompt:")
print(f"=" * 80)
print(result['prompt'])

print(f"\n" + "=" * 80)
print(f"LLM 回答:")
print(f"=" * 80)
print(result['answer'])
```

    ================================================================================
    用户问题: 人工智能包括哪些分支？
    ================================================================================
    
    检索到的文档:
    
    文档 1 (相似度: 0.8471):
      人工智能是计算机科学的重要分支
    
    文档 2 (相似度: 0.6984):
      机器学习是人工智能的子集
    
    ================================================================================
    生成的Prompt:
    ================================================================================
    你是一个专业的问答助手。请基于提供的上下文信息回答用户问题。
                        上下文信息：人工智能是计算机科学的重要分支,机器学习是人工智能的子集
                        用户问题：人工智能包括哪些分支？
                        回答要求：
                        1. 仅基于上下文信息回答，不要添加上下文外的信息
                        2. 如果上下文信息不足以回答问题，请明确说明
                        3. 回答要简洁、准确、有条理
                        4. 如果涉及数字或事实，请确保准确性
                        回答：
                    
    
    ================================================================================
    LLM 回答:
    ================================================================================
    根据上下文信息，人工智能包括机器学习这一分支。上下文未提供其他分支信息。
    

#### Step 2: 高级 Prompt 优化


```python
import openai
import os

class AdvancedRAG(SimpleRAG):
    
    def __init__(self, vector_db, model_name="deepseek-chat"):
        self.vector_db = vector_db
        self.model_name = model_name
        # 使用本地模型替代（如果无法访问OpenAI API）
        self.use_local = False
        self.local_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def build_prompt(self, query, retrieved_texts, metadata_list=None):
        """
        构建更高级的Prompt（包含元数据、结构化输出等）
        """
        if metadata_list is None:
            metadata_list = [{}] * len(retrieved_texts)

        # 构建带编号的上下文
        numbered_context = []
        for i, (text, metadata) in enumerate(zip(retrieved_texts, metadata_list)):
            source_info = ""
            if metadata.get('source'):
                source_info = f" [来源: {metadata['source']}]"
            numbered_context.append(f"[{i+1}] {text}{source_info}")

        context = ",".join(numbered_context)

        prompt = f"""你是一个专业的问答助手，擅长基于提供的文档内容回答问题。
                    ## 任务说明
                    基于以下检索到的文档片段回答用户问题。文档已按相关性排序，编号[1]表示最相关。
                    ## 文档内容
                    {context}
                    ## 用户问题
                    {query}
                    ## 回答要求
                    1. **严格基于文档**：仅使用提供的文档内容，不要添加任何外部知识
                    2. **引用来源**：在回答中标注使用的文档编号，如 [1][2]
                    3. **完整性**：如果单个文档无法完整回答，请综合多个文档的信息
                    4. **诚实性**：如果文档中没有答案，明确说明"文档中没有相关信息"
                    5. **格式**：使用清晰的段落和要点组织答案
                    ## 回答格式
                    **答案：**
                    [你的回答]
                    **参考文档：** [列出使用的文档编号]
                    ---"""

        return prompt

    def query_with_metadata(self, question, k=3):
        """
        带元数据的查询
        """
        query_embedding = self.local_model.encode([question])[0]
        distances, indices, retrieved_texts = self.vector_db.search(query_embedding, k=k)

        # 模拟元数据（实际应用中应从数据库获取）
        metadata_list = [
            {'source': f'doc_{idx}.txt', 'page': 1}
            for idx in indices
        ]

        prompt = self.build_prompt(question, retrieved_texts, metadata_list)
        answer = self.call_llm(prompt)

        return {
            'question': question,
            'retrieved_texts': retrieved_texts,
            'metadata_list': metadata_list,
            'prompt': prompt,
            'answer': answer
        }
        
    def call_llm(self, prompt):
        """
        调用 LLM 生成回答
        """
        if self.use_local:
            # 使用简单规则引擎模拟LLM回答（仅用于测试）
            return self.simple_rule_based_answer(prompt)
        else:
            # 调用 DeepSeek API
            client = OpenAI(
                api_key=os.getenv('DEEPSEEK_API'),
                base_url="https://api.deepseek.com/v1"  # DeepSeek API 端点
            )

            response = client.chat.completions.create(
                model="deepseek-chat",  # 例如 "deepseek-chat"
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content

    def simple_rule_based_answer(self, prompt):
        """
        简单的基于规则的问答（仅用于测试环境）
        实际生产环境应使用真正的 LLM
        """
        # 提取问题和上下文
        lines = prompt.split('\n')
        question = ""
        context = ""

        in_question = False
        in_context = False

        for line in lines:
            if "用户问题：" in line:
                in_question = True
                in_context = False
                question = line.replace("用户问题：", "").strip()
            elif "上下文信息：" in line:
                in_context = True
                in_question = False
            elif line.startswith("回答："):
                break
            elif in_context:
                context += line + "\n"

        
        for keyword, answer in keywords.items():
            if keyword in question or keyword in context:
                return f"基于上下文信息，{answer}"

        return "抱歉，基于提供的上下文信息，我无法回答这个问题。"


# 实验
rag = AdvancedRAG(vector_db)

# 测试查询
query = "人工智能包括哪些分支？"
result = rag.query_with_metadata(query, k=2)

print(f"=" * 80)
print(f"用户问题: {result['question']}")
print(f"=" * 80)
print(f"\n检索到的文档:")
for i, (text, list) in enumerate(zip(result['retrieved_texts'], result['metadata_list'])):
    print(f"  {text}")

print(f"\n" + "=" * 80)
print(f"生成的Prompt:")
print(f"=" * 80)
print(result['prompt'])

print(f"\n" + "=" * 80)
print(f"LLM 回答:")
print(f"=" * 80)
print(result['answer'])
```

    ================================================================================
    用户问题: 人工智能包括哪些分支？
    ================================================================================
    
    检索到的文档:
      人工智能是计算机科学的重要分支
      机器学习是人工智能的子集
    
    ================================================================================
    生成的Prompt:
    ================================================================================
    你是一个专业的问答助手，擅长基于提供的文档内容回答问题。
                        ## 任务说明
                        基于以下检索到的文档片段回答用户问题。文档已按相关性排序，编号[1]表示最相关。
                        ## 文档内容
                        [1] 人工智能是计算机科学的重要分支 [来源: doc_0.txt],[2] 机器学习是人工智能的子集 [来源: doc_2.txt]
                        ## 用户问题
                        人工智能包括哪些分支？
                        ## 回答要求
                        1. **严格基于文档**：仅使用提供的文档内容，不要添加任何外部知识
                        2. **引用来源**：在回答中标注使用的文档编号，如 [1][2]
                        3. **完整性**：如果单个文档无法完整回答，请综合多个文档的信息
                        4. **诚实性**：如果文档中没有答案，明确说明"文档中没有相关信息"
                        5. **格式**：使用清晰的段落和要点组织答案
                        ## 回答格式
                        **答案：**
                        [你的回答]
                        **参考文档：** [列出使用的文档编号]
                        ---
    
    ================================================================================
    LLM 回答:
    ================================================================================
    **答案：**
    根据提供的文档内容，人工智能是计算机科学的重要分支 [1]。文档中明确提及，机器学习是人工智能的一个子集 [2]。因此，基于现有信息，人工智能的一个分支是机器学习。
    
    **参考文档：** [1][2]
    

### 实验三练习题

1. **Prompt A/B 测试**：设计两个不同的Prompt模板，对比回答质量。

2. **上下文长度实验**：测试不同max_context_length对回答质量的影响。

3. **拒绝能力测试**：提出一个文档中不存在的问题，检查模型是否诚实回答。

## 综合实验：完整 RAG 系统

### 实验目标
整合前三个实验，构建一个完整、可用的RAG系统。

### 实验任务

#### 任务描述
构建一个**小说知识问答系统**，能够回答关于《红楼梦》人物关系、情节发展等问题。

#### 数据准备


```python
import os
import json
from openai import OpenAI
from sentence_transformers import SentenceTransformer

# 加载预训练模型
model = SentenceTransformer('all-MiniLM-L6-v2')

import faiss
import numpy as np

class SimpleVectorDB:
    def __init__(self, dimension):
        """
        初始化向量数据库
        :param dimension: 向量维度
        """
        self.dimension = dimension
        # 创建FAISS索引 (L2距离，余弦相似度=1-距离)
        self.index = faiss.IndexFlatL2(dimension)
        # 存储原始文本块
        self.texts = []

    def add_vectors(self, vectors, texts):
        """
        添加向量和文本
        :param vectors: numpy array of vectors
        :param texts: 对应的文本列表
        """
        # 确保向量是float32类型
        vectors = np.array(vectors).astype('float32')
        # 添加到索引
        self.index.add(vectors)
        self.texts.extend(texts)

    def search(self, query_vector, k=3):
        """
        搜索最相似的k个向量
        :param query_vector: 查询向量 (numpy array)
        :param k: 返回top-k结果
        :return: ( distances, indices, texts )
        """
        query_vector = np.array([query_vector]).astype('float32')

        # 搜索
        distances, indices = self.index.search(query_vector, k)

        # 获取对应的文本
        retrieved_texts = [self.texts[idx] for idx in indices[0]]

        return distances[0], indices[0], retrieved_texts

def chunk_text_fixed_length(text, chunk_size=300, overlap=50):
        """
        固定长度切分，带重叠窗口
        :param text: 输入文本
        :param chunk_size: 每块字符数
        :param overlap: 重叠字符数
        :return: 文本块列表
        """
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)

            # 下一块从 end-overlap 开始
            start = end - overlap

            # 防止无限循环
            if start >= len(text):
                break

            if start <= 0:  # 处理极短文本
                break

        return chunks

class NovelRAGSystem:
    def __init__(self):
        self.vector_db = None
        self.embeddings = None
        self.chunks = []
        self.metadata = []

    def load_novel_data(self, file_path):
        """
        加载小说文本文件（txt格式）
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()

        # 切分章节（假设用"第X回"分隔）
        import re
        chapters = re.split(r'第\d+回', text)
        chapters = [ch.strip() for ch in chapters if ch.strip()]

        return chapters
    
    def call_llm(self, prompt):
        """
        调用 LLM 生成回答
        """
        # 调用 DeepSeek API
        client = OpenAI(
            api_key=os.getenv('DEEPSEEK_API'),
            base_url="https://api.deepseek.com/v1"  # DeepSeek API 端点
        )

        response = client.chat.completions.create(
            model="deepseek-chat",  # 例如 "deepseek-chat"
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content
    
    def preprocess_and_index(self, text_chunks, chunk_size=300, overlap=50):
        """
        预处理和索引文档
        """
        # 1. 切分文本
        all_chunks = []

        for chapter_num, chapter in enumerate(text_chunks):
            chunks = chunk_text_fixed_length(chapter, chunk_size, overlap)

            # 为每个chunk添加元数据
            for chunk_idx, chunk in enumerate(chunks):
                all_chunks.append({
                    'text': chunk,
                    'chapter': chapter_num + 1,
                    'chunk_id': chunk_idx + 1
                })

        self.chunks = all_chunks

        # 2. 向量化
        chunk_texts = [chunk['text'] for chunk in all_chunks]
        self.embeddings = model.encode(chunk_texts)

        # 3. 构建向量数据库
        self.vector_db = SimpleVectorDB(dimension=self.embeddings.shape[1])
        self.vector_db.add_vectors(
            self.embeddings,
            chunk_texts
        )

        print(f"   -索引完成！")
        print(f"   - 总chunk数: {len(all_chunks)}")
        print(f"   - 向量维度: {self.embeddings.shape[1]}")

    def query(self, question, top_k=5):
        """
        查询回答
        """
        if self.vector_db is None:
            raise Exception("请先运行 preprocess_and_index() 构建索引")

        query_embedding = model.encode([question])[0]
        distances, indices, retrieved_texts = self.vector_db.search(query_embedding, top_k)

        # 构建prompt
        prompt = self.build_prompt(question, retrieved_texts)

        # 调用LLM
        answer = self.call_llm(prompt)

        return {
            'question': question,
            'answer': answer,
            'prompt': prompt,
            'retrieved_chunks': [
                {
                    'text': retrieved_texts[i],
                    'distance': distances[i],
                    'metadata': self.chunks[indices[i]]
                }
                for i in range(len(retrieved_texts))
            ]
        }

    def build_prompt(self, question, retrieved_texts):
        """
        构建小说问答的专用Prompt
        """
        context = "\n\n".join([
            f"[片段{i+1}] {text}"
            for i, text in enumerate(retrieved_texts)
        ])

        prompt = f"""你是一个红学专家，对《红楼梦》有深入研究。请基于提供的文本片段回答用户关于红楼梦的问题。
                ## 重要原则
                1. 严格基于提供的文本片段回答
                2. 如果需要引用情节，请说明在哪个片段中找到
                3. 对于人物关系，要准确引用原文描述
                4. 如果片段中没有相关信息，明确说明
                ## 文本片段
                {context}
                ## 问题
                {question}
                ## 回答
                """

        return prompt

    def evaluate(self, test_queries):
        """
        评估系统性能
        """
        results = []

        for query_info in test_queries:
            query = query_info['question']
            expected = query_info.get('expected_answer', '')

            result = self.query(query)
            result['expected'] = expected

            results.append(result)

        return results
```

### 开始实验


```python
# 实验
rag = NovelRAGSystem()
rag.preprocess_and_index(rag.load_novel_data('hlm.txt'))
```

       -索引完成！
       - 总chunk数: 3307
       - 向量维度: 384
    


```python
question = "《五美吟》的内容是什么？"
result = rag.query(question, top_k=5)

print(f"=" * 80)
print(f"用户问题: {result['question']}")
print(f"=" * 80)
print(f"\n检索到的块:")
print(result['retrieved_chunks'])

print(f"\n" + "=" * 80)
print(f"生成的Prompt:")
print(f"=" * 80)
print(result['prompt'])

print(f"\n" + "=" * 80)
print(f"LLM 回答:")
print(f"=" * 80)
print(result['answer'])


```

    ================================================================================
    用户问题: 《五美吟》的内容是什么？
    ================================================================================
    
    检索到的块:
    [{'text': '娇娆？都缘顽福前生造，更有同归慰寂寥。\n红拂\n长剑雄谈态自殊，美人巨眼识穷途。尸居余气杨公幕，岂得羁縻女丈夫？\n宝玉看了，赞不绝口。又说道：“妹妹这诗，恰好只做了五首，何不就命曰《五美吟》？”于是不容分说，便提笔写在后面。宝钗亦说道：“做诗不论何题，只要善翻古人之意。若要随人脚踪走去，纵使字句精工，已落第二义，究竟算不得好诗。即如前人所咏昭君之诗甚多，有悲挽昭君的，有怨恨延寿的，又有讥汉帝不能使画工图貌贤臣而画美人的，纷纷不一。后来王荆公复有“意态由来画不成，当时枉杀毛延寿”；欧阳永叔有“耳目所见尚如此，万瑞安能制夷狄”：二诗俱能各出己见，不与人同。今日林妹妹这五首诗，亦可谓命意新奇，别开生面', 'distance': np.float32(0.8879534), 'metadata': {'text': '娇娆？都缘顽福前生造，更有同归慰寂寥。\n红拂\n长剑雄谈态自殊，美人巨眼识穷途。尸居余气杨公幕，岂得羁縻女丈夫？\n宝玉看了，赞不绝口。又说道：“妹妹这诗，恰好只做了五首，何不就命曰《五美吟》？”于是不容分说，便提笔写在后面。宝钗亦说道：“做诗不论何题，只要善翻古人之意。若要随人脚踪走去，纵使字句精工，已落第二义，究竟算不得好诗。即如前人所咏昭君之诗甚多，有悲挽昭君的，有怨恨延寿的，又有讥汉帝不能使画工图貌贤臣而画美人的，纷纷不一。后来王荆公复有“意态由来画不成，当时枉杀毛延寿”；欧阳永叔有“耳目所见尚如此，万瑞安能制夷狄”：二诗俱能各出己见，不与人同。今日林妹妹这五首诗，亦可谓命意新奇，别开生面', 'chapter': 1, 'chunk_id': 1694}}, {'text': '文。及至第三出，只见金童玉女，旗旛宝幢，引着一个霓裳羽衣的小旦，头上披着一条黑帕，唱了几句儿进去了。众皆不知。听见外面人说：“这是新打的蕊珠记里的“冥升”。小旦扮的是嫦娥，前因堕落人寰，几乎给人为配；幸亏观音点化，他就未嫁而逝。此时升引月宫。不听见里头唱的：“人间只道风情好，那知道秋月春花容易抛？几乎不把广寒宫忘却了！””第四出是“吃糠”。第五出是“达摩带着徒弟过江回去”。正扮出些海市蜃楼，好不热闹。\n众人正在高兴时，忽见薛家的人满头汗闯进来，向薛蝌说道：“二爷快回去！一并里头回明太太，也请回去！家里有要紧事。”薛蝌道：什么事？”家人道：“家去说罢。”薛蝌也不及告辞，就走了。薛姨妈见里头丫头传', 'distance': np.float32(0.9940808), 'metadata': {'text': '文。及至第三出，只见金童玉女，旗旛宝幢，引着一个霓裳羽衣的小旦，头上披着一条黑帕，唱了几句儿进去了。众皆不知。听见外面人说：“这是新打的蕊珠记里的“冥升”。小旦扮的是嫦娥，前因堕落人寰，几乎给人为配；幸亏观音点化，他就未嫁而逝。此时升引月宫。不听见里头唱的：“人间只道风情好，那知道秋月春花容易抛？几乎不把广寒宫忘却了！””第四出是“吃糠”。第五出是“达摩带着徒弟过江回去”。正扮出些海市蜃楼，好不热闹。\n众人正在高兴时，忽见薛家的人满头汗闯进来，向薛蝌说道：“二爷快回去！一并里头回明太太，也请回去！家里有要紧事。”薛蝌道：什么事？”家人道：“家去说罢。”薛蝌也不及告辞，就走了。薛姨妈见里头丫头传', 'chapter': 1, 'chunk_id': 2339}}, {'text': '的躺下了。原来宝钗袭人因昨夜不曾睡，又兼日间劳乏了一天，所以睡去，都不曾听见他们说话，此时院中一响，猛然惊醒，听了听，也无动静。宝玉此时躺在床上，心里疑惑：“莫非林妹妹来了，听见我和五儿说话，故意吓我们的？……”翻来覆去，胡思乱想，五更以后，才朦胧睡去。\n却说五儿被宝玉鬼混了半夜，又兼宝钗咳嗽，自己怀着鬼胎，生怕宝钗听见了，也是思前想后，一夜无眠。次日一早起来，见宝玉尚自昏昏睡着，便轻轻儿的收拾了屋子。那里麝月已醒，便道：“你怎么这么早起来了？你难道一夜没睡吗？”五儿听这话又似麝月知道了的光景，便只是讪笑，也不答言。\n一时，宝钗袭人也都起来。开了门，见宝玉尚睡，却也纳闷：“怎么在外头两夜睡的倒', 'distance': np.float32(1.0152805), 'metadata': {'text': '的躺下了。原来宝钗袭人因昨夜不曾睡，又兼日间劳乏了一天，所以睡去，都不曾听见他们说话，此时院中一响，猛然惊醒，听了听，也无动静。宝玉此时躺在床上，心里疑惑：“莫非林妹妹来了，听见我和五儿说话，故意吓我们的？……”翻来覆去，胡思乱想，五更以后，才朦胧睡去。\n却说五儿被宝玉鬼混了半夜，又兼宝钗咳嗽，自己怀着鬼胎，生怕宝钗听见了，也是思前想后，一夜无眠。次日一早起来，见宝玉尚自昏昏睡着，便轻轻儿的收拾了屋子。那里麝月已醒，便道：“你怎么这么早起来了？你难道一夜没睡吗？”五儿听这话又似麝月知道了的光景，便只是讪笑，也不答言。\n一时，宝钗袭人也都起来。开了门，见宝玉尚睡，却也纳闷：“怎么在外头两夜睡的倒', 'chapter': 1, 'chunk_id': 2967}}, {'text': '笑嘻嘻的问道：“你和晴雯姐姐好不是啊？”\n五儿听了，摸不着头脑，便道：“都是姊妹，也没有什么不好的。”宝玉又悄悄的问道：“晴雯病重了，我看他去，不是你也去了么？”五儿微微笑着点头儿。宝玉道：“你听见他说什么了没有？”五儿摇着头儿道：“没有。”宝玉已经忘神，便把五儿的手一拉。五儿急的红了脸，心里乱跳，便悄悄说道：“二爷，有什么话只管说，别拉拉扯扯的。”宝玉才撒了手，说道：“他和我说来着：“早知担了个虚名，也就打正经主意了！”你怎么没听见么？”\n五儿听了这话明明是撩拨自己的意思，又不敢怎么样，便说道：“那是他自己没脸。这也是我们女孩儿家说得的吗？”宝玉着急道：“你怎么也是这么个道学先生！我看你长的', 'distance': np.float32(1.0164812), 'metadata': {'text': '笑嘻嘻的问道：“你和晴雯姐姐好不是啊？”\n五儿听了，摸不着头脑，便道：“都是姊妹，也没有什么不好的。”宝玉又悄悄的问道：“晴雯病重了，我看他去，不是你也去了么？”五儿微微笑着点头儿。宝玉道：“你听见他说什么了没有？”五儿摇着头儿道：“没有。”宝玉已经忘神，便把五儿的手一拉。五儿急的红了脸，心里乱跳，便悄悄说道：“二爷，有什么话只管说，别拉拉扯扯的。”宝玉才撒了手，说道：“他和我说来着：“早知担了个虚名，也就打正经主意了！”你怎么没听见么？”\n五儿听了这话明明是撩拨自己的意思，又不敢怎么样，便说道：“那是他自己没脸。这也是我们女孩儿家说得的吗？”宝玉着急道：“你怎么也是这么个道学先生！我看你长的', 'chapter': 1, 'chunk_id': 2963}}, {'text': '五祖宏忍在黄梅，他便充作火头僧。五祖欲求法嗣，令诸僧各出一偈。座神秀说道：“身是菩提树，心如明镜台。时时勤拂拭，莫使有尘埃。”惠能在厨房舂米，听了，道：“美则美矣，了则未了，”因自念一偈曰：“菩提本非树，明镜亦非台。本来无一物，何处染尘埃？”五祖便将衣钵传给了他。今儿这偈语，亦同此意了。只是方才这句机锋，尚未完全了结，这便丢开手不成？”黛玉笑道：“他不能答，就算输了。这会子答上了，也不为出奇了。只是以后再不许谈禅了。连我们两个所知所能的，你还不知不能呢，还去参什么禅呢！”\n宝玉自己以为觉悟，不想忽被黛玉一问，便不能答；宝钗又比出语录来：此皆素不见他们所能的。自己想了一想：“原来他们比我的知觉在', 'distance': np.float32(1.0209681), 'metadata': {'text': '五祖宏忍在黄梅，他便充作火头僧。五祖欲求法嗣，令诸僧各出一偈。座神秀说道：“身是菩提树，心如明镜台。时时勤拂拭，莫使有尘埃。”惠能在厨房舂米，听了，道：“美则美矣，了则未了，”因自念一偈曰：“菩提本非树，明镜亦非台。本来无一物，何处染尘埃？”五祖便将衣钵传给了他。今儿这偈语，亦同此意了。只是方才这句机锋，尚未完全了结，这便丢开手不成？”黛玉笑道：“他不能答，就算输了。这会子答上了，也不为出奇了。只是以后再不许谈禅了。连我们两个所知所能的，你还不知不能呢，还去参什么禅呢！”\n宝玉自己以为觉悟，不想忽被黛玉一问，便不能答；宝钗又比出语录来：此皆素不见他们所能的。自己想了一想：“原来他们比我的知觉在', 'chapter': 1, 'chunk_id': 536}}]
    
    ================================================================================
    生成的Prompt:
    ================================================================================
    你是一个红学专家，对《红楼梦》有深入研究。请基于提供的文本片段回答用户关于红楼梦的问题。
                    ## 重要原则
                    1. 严格基于提供的文本片段回答
                    2. 如果需要引用情节，请说明在哪个片段中找到
                    3. 对于人物关系，要准确引用原文描述
                    4. 如果片段中没有相关信息，明确说明
                    ## 文本片段
    [片段1] 娇娆？都缘顽福前生造，更有同归慰寂寥。红拂长剑雄谈态自殊，美人巨眼识穷途。尸居余气杨公幕，岂得羁縻女丈夫？
    宝玉看了，赞不绝口。又说道：“妹妹这诗，恰好只做了五首，何不就命曰《五美吟》？”于是不容分说，便提笔写在后面。宝钗亦说道：“做诗不论何题，只要善翻古人之意。若要随人脚踪走去，纵使字句精工，已落第二义，究竟算不得好诗。即如前人所咏昭君之诗甚多，有悲挽昭君的，有怨恨延寿的，又有讥汉帝不能使画工图貌贤臣而画美人的，纷纷不一。后来王荆公复有“意态由来画不成，当时枉杀毛延寿”；欧阳永叔有“耳目所见尚如此，万瑞安能制夷狄”：二诗俱能各出己见，不与人同。今日林妹妹这五首诗，亦可谓命意新奇，别开生面
    
    [片段2] 文。及至第三出，只见金童玉女，旗旛宝幢，引着一个霓裳羽衣的小旦，头上披着一条黑帕，唱了几句儿进去了。众皆不知。听见外面人说：“这是新打的蕊珠记里的“冥升”。小旦扮的是嫦娥，前因堕落人寰，几乎给人为配；幸亏观音点化，他就未嫁而逝。此时升引月宫。不听见里头唱的：“人间只道风情好，那知道秋月春花容易抛？几乎不把广寒宫忘却了！””第四出是“吃糠”。第五出是“达摩带着徒弟过江回去”。正扮出些海市蜃楼，好不热闹。
    众人正在高兴时，忽见薛家的人满头汗闯进来，向薛蝌说道：“二爷快回去！一并里头回明太太，也请回去！家里有要紧事。”薛蝌道：什么事？”家人道：“家去说罢。”薛蝌也不及告辞，就走了。薛姨妈见里头丫头传
    
    [片段3] 的躺下了。原来宝钗袭人因昨夜不曾睡，又兼日间劳乏了一天，所以睡去，都不曾听见他们说话，此时院中一响，猛然惊醒，听了听，也无动静。宝玉此时躺在床上，心里疑惑：“莫非林妹妹来了，听见我和五儿说话，故意吓我们的？……”翻来覆去，胡思乱想，五更以后，才朦胧睡去。
    却说五儿被宝玉鬼混了半夜，又兼宝钗咳嗽，自己怀着鬼胎，生怕宝钗听见了，也是思前想后，一夜无眠。次日一早起来，见宝玉尚自昏昏睡着，便轻轻儿的收拾了屋子。那里麝月已醒，便道：“你怎么这么早起来了？你难道一夜没睡吗？”五儿听这话又似麝月知道了的光景，便只是讪笑，也不答言。
    一时，宝钗袭人也都起来。开了门，见宝玉尚睡，却也纳闷：“怎么在外头两夜睡的倒
    
    [片段4] 笑嘻嘻的问道：“你和晴雯姐姐好不是啊？”
    五儿听了，摸不着头脑，便道：“都是姊妹，也没有什么不好的。”宝玉又悄悄的问道：“晴雯病重了，我看他去，不是你也去了么？”五儿微微笑着点头儿。宝玉道：“你听见他说什么了没有？”五儿摇着头儿道：“没有。”宝玉已经忘神，便把五儿的手一拉。五儿急的红了脸，心里乱跳，便悄悄说道：“二爷，有什么话只管说，别拉拉扯扯的。”宝玉才撒了手，说道：“他和我说来着：“早知担了个虚名，也就打正经主意了！”你怎么没听见么？”
    五儿听了这话明明是撩拨自己的意思，又不敢怎么样，便说道：“那是他自己没脸。这也是我们女孩儿家说得的吗？”宝玉着急道：“你怎么也是这么个道学先生！我看你长的
    
    [片段5] 五祖宏忍在黄梅，他便充作火头僧。五祖欲求法嗣，令诸僧各出一偈。座神秀说道：“身是菩提树，心如明镜台。时时勤拂拭，莫使有尘埃。”惠能在厨房舂米，听了，道：“美则美矣，了则未了，”因自念一偈曰：“菩提本非树，明镜亦非台。本来无一物，何处染尘埃？”五祖便将衣钵传给了他。今儿这偈语，亦同此意了。只是方才这句机锋，尚未完全了结，这便丢开手不成？”黛玉笑道：“他不能答，就算输了。这会子答上了，也不为出奇了。只是以后再不许谈禅了。连我们两个所知所能的，你还不知不能呢，还去参什么禅呢！”
    宝玉自己以为觉悟，不想忽被黛玉一问，便不能答；宝钗又比出语录来：此皆素不见他们所能的。自己想了一想：“原来他们比我的知觉在

    ## 问题
    《五美吟》的内容是什么？
    ## 回答
                    
    
    ================================================================================
    LLM 回答:
    ================================================================================
    根据提供的文本片段，关于《五美吟》的内容，仅在[片段1]中有所提及。该片段显示：
    
    1. **《五美吟》的由来**：宝玉看了黛玉的诗后，赞不绝口，并建议将五首诗命名为《五美吟》（片段1中：“恰好只做了五首，何不就命曰《五美吟》？”）。
    
    2. **部分诗句内容**：片段1中直接引用了《五美吟》中的两首诗：
       - **红拂**：诗句为“长剑雄谈态自殊，美人巨眼识穷途。尸居余气杨公幕，岂得羁縻女丈夫？”
       - **另一首（未明确人名）**：前两句为“娇娆？都缘顽福前生造，更有同归慰寂寥。”（从上下文推断，这应属于五首之一，但具体人物未说明）。
    
    3. **其他信息**：宝钗在片段1中评论黛玉的诗“命意新奇，别开生面”，并提及前人咏昭君的诗作，但未涉及《五美吟》其他三首诗的具体内容。
    
    **结论**：基于提供的片段，《五美吟》的内容仅知包括咏红拂和另一未指名女性的诗，其余三首的具体诗句和人物均未出现。片段中无《五美吟》完整内容的描述。
    

### 评估指标


```python
# TODO
```

## 扩展阅读

### 必读资源
1. **Faiss 官方指南**
   - [Faiss Wiki - Getting Started](https://github.com/facebookresearch/faiss/wiki/Getting-started)
   - 理解不同索引类型的适用场景

2. **Sentence-Transformers 文档**
   - [官方文档](https://www.sbert.net/)
   - 学习如何选择合适的预训练模型

3. **RAG 原始论文**
   - [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)
   - 理解RAG的设计思想

### 进阶资源
1. **Dense Passage Retrieval (DPR)**
   - [DPR Paper](https://arxiv.org/abs/2004.04906)
   - 学习更好的密集检索方法

2. **HyDE: Hypothetical Document Embeddings**
   - [HyDE Paper](https://arxiv.org/abs/2212.10496)
   - 了解查询改写技术

3. **向量数据库对比**
   - [Pinecone: Vector Database Guide](https://www.pinecone.io/learn/vector-database/)
   - 了解不同向量数据库的特点
