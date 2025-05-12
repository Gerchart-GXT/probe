import asyncio
from Logger import Logger
import logging
import asyncio
import websockets
import json
from collections import deque
from Logger import Logger
from Database import Database
from WebSocketReceive import WebSocketReceive
from SystemInfoHandler import SystemInfoHandler

HOST = "0.0.0.0"  # WebSocket 服务器绑定的主机地址
PORT = 9999       # WebSocket 服务器绑定的端口
SECRET = "your_secret_key"  # 用于验证客户端的密钥
DB_PATH = "monitoring_system.db"  # SQLite 数据库文件路径

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

logger = Logger(**LOG_CONFIG)
# 创建 asyncio.Queue 用于存储接收到的数据
data_queue = asyncio.Queue()

# 创建 Database 实例
db = Database(db_path=DB_PATH, logger=logger)
db.connect()
db.create_tables()  # 确保表已创建

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

async def main():
    """
    启动 WebSocket 服务器和数据处理任务。
    """
    # 启动 SystemInfoHandler 的数据处理任务
    asyncio.create_task(handler.process_data())

    # 启动 WebSocket 服务器
    await ws_receiver.start()

if __name__ == "__main__":
    # 运行主程序
    asyncio.get_event_loop().run_until_complete(main())
    asyncio.get_event_loop().run_forever()

 