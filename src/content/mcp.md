# MCP (模型上下文协议) 简介
MCP 起源于 2024 年 11 月 25 日 Anthropic 发布的文章：[Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
MCP 是一个开放协议，它为应用程序向 LLM 提供上下文的方式进行了标准化。你可以将 MCP 想象成 AI 应用程序的 USB-C 接口。就像 USB-C 为设备连接各种外设和配件提供了标准化的方式一样，MCP 为 AI 模型连接各种数据源和工具提供了标准化的接口。
MCP 服务器可以：
- 通过 **Resources** 公开数据（可以将其视为类似 GET 端点；用于将信息加载到 LLM 的上下文中）
- 通过 **Tools** 提供功能（类似 POST 端点；用于执行代码或产生副作用）
- 通过 **Prompts** 定义交互模式（LLM 交互的可重用模板）

# 为什么选择 MCP？
我认为 MCP 的出现是 prompt engineering 发展的产物。更结构化的上下文信息对模型的效果提升是显著的。我们在构造 prompt 时，希望能提供一些更特殊的信息（比如本地文件，数据库，一些网络实时信息等）给模型，这样模型更容易理解真实场景中的问题。

**想象一下没有 MCP 之前我们会怎么做？** 我们可能会人工从数据库中筛选或者使用工具检索可能需要的信息，手动的粘贴到 prompt 中。随着我们要解决的问题越来越复杂，手工把信息引入到 prompt 中会变得越来越困难。

为了克服手工 prompt 的局限性，许多 LLM 平台（如 OpenAI、Google）引入了 function call（将自然语言转换为 API 调用） 功能。这一机制允许模型在需要时调用预定义的函数来获取数据或执行操作，显著提升了自动化水平。

对比之下 MCP 的优势在于：
**生态** - MCP 提供很多现成的插件 [MCP Market](https://mcpmarket.cn/)，你的 AI 可以直接使用。
**统一性** - 不限制于特定的 AI 模型，任何支持 MCP 的模型都可以灵活切换。
**数据安全** - 你的敏感数据留在自己的电脑上，不必全部上传。（因为我们可以自行设计接口确定传输哪些数据）


# 通用架构
![MCP通用架构](/images/mcp/jiagou.png)
MCP 核心采用客户端-服务器架构，主机应用可以连接多个服务器：
- **MCP Hosts**: 如 Claude Desktop、IDE(VS Code, Pycharm) 或 AI 工具，希望通过 MCP 访问数据的程序
- **MCP Clients**: 维护与服务器一对一连接的协议客户端
- **MCP Servers**: 轻量级程序，通过标准的 Model Context Protocol 提供特定能力
- **本地数据源**: MCP 服务器可安全访问的计算机文件、数据库和服务
- **远程服务**: MCP 服务器可连接的互联网上的外部系统（如通过 APIs）

让我们通过一个实际场景来理解这些组件如何协同工作：
假设你正在使用 VS Code (Host) 询问："曼哈顿的天气怎么样？"
- **Host**：VS Code 作为 Host，负责接收你的提问并与 LLM 交互。
- **Client**：当 LLM 模型决定需要获取天气信息时，Host 中内置的 MCP Client 会被激活。这个 Client 负责与适当的 MCP Server 建立连接。
- **Server**：在这个例子中，文件系统 MCP Server 会被调用。它负责查询和格式化来自 National Weather Service API 的数据。

整个流程是这样的：你的问题 → VS Code(Host) → LLM 模型 → 需要天气信息 → MCP Client 连接 → 天气系统 MCP Server → 执行操作 → 返回结果 → LLM 生成回答 → 显示在 VS Code 上。

这种架构设计使得 LLM 可以在不同场景下灵活调用各种工具和数据源，而开发者只需专注于开发对应的 MCP Server，无需关心 Host 和 Client 的实现细节。

# 面向服务器开发者

使用 MCP 使 LLM 获取天气预报和恶劣天气警报的能力。

导入 packages 并设置 instance
```python
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP

# 初始化 FastMCP server
mcp = FastMCP("weather")

# Constants
NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "weather-app/1.0"
```
### Helper Functions
添加 Helper Functions，用于查询和格式化来自 National Weather Service API 的数据：
```python
async def make_nws_request(url: str) -> dict[str, Any] | None:
    """向 NWS API 发送请求，并进行适当的错误处理。"""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

def format_alert(feature: dict) -> str:
    """将警报 feature 格式化为可读的字符串。"""
    props = feature["properties"]
    return f"""
事件: {props.get('event', 'Unknown')}
区域: {props.get('areaDesc', 'Unknown')}
严重性: {props.get('severity', 'Unknown')}
描述: {props.get('description', 'No description available')}
指示: {props.get('instruction', 'No specific instructions provided')}
"""
```

### Tool Execution
Tool Execution Handler 负责实际执行每个 tool 的逻辑
```python
@mcp.tool()
async def get_alerts(state: str) -> str:
    """获取美国州的天气警报。

    Args:
        state: 两个字母的美国州代码（例如 CA、NY）
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        return "无法获取警报或未找到警报。"

    if not data["features"]:
        return "该州没有活跃的警报。"

    alerts = [format_alert(feature) for feature in data["features"]]
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """获取某个位置的天气预报。

    Args:
        latitude: 位置的纬度
        longitude: 位置的经度
    """
    # 首先获取预报网格 endpoint
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        return "无法获取此位置的预报数据。"

    # 从 points response 中获取预报 URL
    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        return "无法获取详细预报。"

    # 将 periods 格式化为可读的预报
    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:  # 仅显示接下来的 5 个 periods
        forecast = f"""
{period['name']}:
温度: {period['temperature']}°{period['temperatureUnit']}
风: {period['windSpeed']} {period['windDirection']}
预报: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    return "\n---\n".join(forecasts)
```

初始化并运行 server：
```python
def main() -> None:
    """模块入口，供 `python -m weather` 或 `weather:main` 脚本调用。

    该函数会启动 MCP server 并阻塞，使用 stdio 作为传输层（用于 VS Code MCP 集成）。
    """
    mcp.run(transport="stdio")


if __name__ == "__main__":
    # 直接运行时打印错误再抛出，便于调试依赖或运行时问题
    try:
        main()
    except Exception as e:
        import sys
        print(f"启动 MCP 服务失败: {e}", file=sys.stderr)
        raise
```
```
uv run weather.py
```
# 在 VS Code 上的使用效果
![Copilot](/images/mcp/result.png)
![Server](/images/mcp/server.png)



# 附录一：使用 uv 创建 MCP 虚拟环境
```
uv venv     //在当前工作目录创建uv虚拟环境
.venv\Scripts\activate      //启动虚拟环境
uv add mcp[cli] httpx       //安装依赖包
```


# 附录二：VS Code 中配置 MCP 服务
`chat.mcp.access ` 设置控制哪些 MCP 服务器可以在 VS Code 中安装和运行
`all`（默认）：允许所有 MCP 服务器
`registry`：只允许来自注册表的 MCP 服务器
`none`：不允许任何 MCP 服务器
>MCP 服务器可以在你的机器上运行任意代码。只添加来自受信任来源的服务器，并在启动前审查发布者和服务器配置。

### 将 MCP 服务器添加到工作区 `mcp.json` 文件
- 在你的工作区中创建 .VS Codeode/mcp.json 文件。
- 选择编辑器中的添加服务器按钮以添加新服务器的模板。VS Code 为 MCP 服务器配置文件提供了智能感知。
```json
{
    "servers": {
        "weather": {
            "type": "stdio",
            "command": "uv",
            "args": [
                "--directory",
                "C:\\Users\\Admin\\Desktop\\MCP",
                "run",
                "weather.py"
            ]
        }
    }
}
```

### 在代理模式中使用 MCP 工具
添加 MCP 服务器后，在代理模式下使用它提供的工具。
- 打开聊天视图（Ctrl+Alt+I），然后从下拉列表中选择代理模式
![MCP](/images/mcp/mode.png)
- 选择工具按钮以查看可用工具列表。
![Agent](/images/mcp/vsc_mcp.png)