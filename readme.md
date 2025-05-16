# 服务器探针监控系统

## 一、架构介绍

本项目是一个完整的服务器监控系统，由三个主要部分组成：

1. **Agent（探针）**：
   - 部署在被监控的服务器上
   - 负责收集系统信息（CPU、内存、磁盘、网络等）
   - 通过WebSocket将数据实时发送到后端服务器

2. **Backend（后端）**：
   - 包含两个主要模块：
     - **Server**：开启WebSocket服务器，用于接收来自Agent的实时数据，处理并存储到数据库；开放REST API服务器，为Web服务器提供Agent信息与性能数据。
     - **Web**：提供REST API和WebSocket服务，为前端面板提供数据支持

3. **Frontend（前端）**：
   - 基于React构建的Web管理面板
   - 提供用户界面，展示服务器状态和性能数据，同时通过WebScoket，动态更新服务器实时性能数据
   - 支持用户注册、登录、服务器订阅管理等功能

## 二、安装部署方法

### 1. 安装Agent和Backend

```bash
# 克隆项目
git clone https://github.com/Gerchart-GXT/probe.git

# 进入项目目录
cd probe

# 为Agent创建虚拟环境
cd agent
python3 -m venv agent-venv
source agent-venv/bin/activate
pip install -r requirement.txt

# 为Backend创建虚拟环境
cd back
python3 -m venv back-venv
source back-venv/bin/activate
pip install -r requirement.txt
```

### 2. 安装Node.js和前端依赖

```bash
# 安装Node.js（请确保已安装Node.js）

# 进入前端目录
cd front

# 安装依赖
npm install
```

### 3. 配置服务器URL

- **Agent**：
  修改`agent/src/config.json`中的`url`字段，指向Server的WebSocket地址

- **Server**：
  修改`back/src/server/server.py`开头的配置，设置数据连接、WebSocket地址、REST API接口地址

- **Web**：
  修改`back/src/web/app.py`开头的配置，设置数据连接、WebSocket地址、REST API接口地址

### 4. 运行Agent

```bash
cd agent
source agent-venv/bin/activate
python src/agent.py
```

### 5. 运行Server

```bash
cd back
source back-venv/bin/activate
python src/server/server.py
```

### 6. 运行Web

```bash
cd back
source back-venv/bin/activate
python src/web/app.py
```

### 7. 启动前端面板

```bash
cd front
npm start
```

## 四、访问系统

1. 打开浏览器，访问`http://localhost:3000`
2. 使用注册功能创建新账户
3. 登录后即可订阅查看服务器状态和性能数据

## 五、项目结构

```
agent/                # 探针程序
back/                 # 后端服务
front/                # 前端面板
readme.md             # 项目说明文档
```
