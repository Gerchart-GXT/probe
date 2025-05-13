import asyncio
from Logger import Logger
import logging
import websockets
import json
from collections import deque
from Logger import Logger
from ASDatebase import ASDatabase
from WebSocketReceive import WebSocketReceive
from SystemInfoHandler import SystemInfoHandler
from flask import Flask, jsonify, request
import threading

# 配置
HOST = "0.0.0.0"  # WebSocket 服务器绑定的主机地址
PORT = 9999       # WebSocket 服务器绑定的端口
SECRET = "your_secret_key"  # 用于验证客户端的密钥
DB_PATH = "agent-server.db"  # SQLite 数据库文件路径
FLASK_HOST = "0.0.0.0"  # Flask 服务器绑定的主机地址
FLASK_PORT = 8888       # Flask 服务器绑定的端口

# 日志配置
LOG_CONFIG = {
    "name": "my_app",
    "log_file": "app.log",
    "log_level": logging.DEBUG,
    "console": True,
    "file_rotation": {
        "maxBytes": 1024 * 1024 * 10,
        "backupCount": 5
    },
    "formatter": "[%(asctime)s]-[%(levelname)s]: %(message)s"
}

# 创建 Logger 实例
logger = Logger(**LOG_CONFIG)

# 创建 asyncio.Queue 用于存储接收到的数据
data_queue = asyncio.Queue()

# 创建 SystemInfoHandler 实例
handler = SystemInfoHandler(data_queue=data_queue, db_path=DB_PATH, logger=logger)

# 创建 WebSocketReceive 实例
ws_receiver = WebSocketReceive(
    host=HOST,
    port=PORT,
    secret=SECRET,
    data_queue=data_queue,
    logger=logger
)

# 创建 Flask 应用
app = Flask(__name__)

def get_db():
    """
    获取当前线程的 SQLite 连接。
    """
    if not hasattr(threading.current_thread(), "db"):
        threading.current_thread().db = ASDatabase(db_path=DB_PATH, logger=logger)
        threading.current_thread().db.connect()
    return threading.current_thread().db

@app.route("/servers", methods=["GET"])
def get_servers():
    """
    获取已记录的服务器信息。
    """
    db = get_db()
    servers = db.get_servers()
    return jsonify(servers)

@app.route("/performance", methods=["GET"])
def get_performance():
    """
    获取指定时间段内所有服务器的性能信息。
    """
    db = get_db()
    start_time = request.args.get("start_time")
    end_time = request.args.get("end_time")
    if not start_time or not end_time:
        return jsonify({"error": "start_time and end_time are required"}), 400

    performance_data = []
    servers = db.get_servers()
    for server in servers:
        logger.debug(server)
        server_id = server["id"]
        data = db.get_performance_data(server_id=server_id, start_time=start_time, end_time=end_time)
        performance_data.extend(data)

    return jsonify(performance_data)

def start_flask_server():
    """
    启动 Flask 服务器。
    """
    app.run(host=FLASK_HOST, port=FLASK_PORT)

async def main():
    """
    启动 WebSocket 服务器和数据处理任务。
    """
    # 启动 SystemInfoHandler 的数据处理任务
    asyncio.create_task(handler.process_data())

    # 启动 WebSocket 服务器
    await ws_receiver.start()

if __name__ == "__main__":
    # 启动 Flask 服务器（在单独的线程中）
    flask_thread = threading.Thread(target=start_flask_server)
    flask_thread.daemon = True  # 设置为守护线程，主线程退出时 Flask 线程也会退出
    flask_thread.start()

    # 运行主程序
    asyncio.get_event_loop().run_until_complete(main())
    asyncio.get_event_loop().run_forever()