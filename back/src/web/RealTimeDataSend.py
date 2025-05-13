import time
import threading
from flask_socketio import SocketIO, emit
from flask import Flask
from typing import Dict, List
from Logger import Logger
from USDatabase import USDatabase

class RealTimeDataSend:
    def __init__(self, db: USDatabase, logger: Logger, socketio: SocketIO, interval: int = 1):  # 添加 flask_app 参数
        """
        初始化 RealTimeDataSend 类。

        :param db: 数据库实例
        :param logger: 日志记录器实例
        :param socketio: Flask-SocketIO 实例
        :param interval: 数据发送间隔（秒，默认 5 秒）
        """
        self.db = db
        self.logger = logger
        self.socketio = socketio
        self.interval = interval
        self.active_connections = {}

    def start_sending_data(self, user_id: int):
        """
        启动数据发送线程，定期发送用户订阅的服务器的最新性能数据。

        :param user_id: 用户 ID
        """
        if user_id in self.active_connections:
            self.logger.warning(f"User {user_id} already has an active connection.")
            return

        # 标记用户连接为活跃
        self.active_connections[user_id] = True

        # 启动线程
        thread = threading.Thread(target=self._send_data, args=(user_id,))
        thread.daemon = True
        thread.start()

    def stop_sending_data(self, user_id: int):
        """
        停止数据发送线程。

        :param user_id: 用户 ID
        """
        if user_id in self.active_connections:
            self.active_connections[user_id] = False
            self.logger.info(f"Stopped sending data for user {user_id}.")
        else:
            self.logger.warning(f"No active connection found for user {user_id}.")

    def _send_data(self, user_id: int):
        """
        定期发送用户订阅的服务器的最新性能数据。

        :param user_id: 用户 ID
        """
        while self.active_connections.get(user_id, False):
            try:
                # 获取用户订阅的服务器列表
                subscriptions = self.db.execute_query(
                    "SELECT server_id FROM subscriptions WHERE user_id = ?", (user_id,), fetch=True
                )
                if not subscriptions:
                    self.logger.warning(f"No subscriptions found for user {user_id}.")
                    time.sleep(self.interval)
                    continue

                # 获取每个服务器的最新性能数据
                data = []
                for sub in subscriptions:
                    # self.logger.debug(f'{user_id} subs {sub}')
                    server_id = sub["server_id"]
                    latest_performance = self.db.execute_query(
                        """
                        SELECT * FROM performance_data
                        WHERE server_id = ?
                        ORDER BY timestamp DESC
                        LIMIT 1
                        """,
                        (server_id,),
                        fetch=True,
                    )
                    # self.logger.debug(f'{sub["server_id"]}\s Data: {latest_performance}')
                    if latest_performance:
                        data.append(latest_performance[0])

                # 发送数据给客户端
                if data:
                    try:
                        self.socketio.emit("server_data", {"user_id": user_id, "data": data}, room=str(user_id))
                        self.logger.info(f"Sent latest data to user {user_id} in room {str(user_id)}")
                    except Exception as e:
                        self.logger.error(f"Error when emitting data: {e}")
                else:
                    self.logger.warning(f"No performance data found for user {user_id}.")

            except Exception as e:
                self.logger.error(f"Error sending data to user {user_id}: {e}")

            # 等待指定间隔
            time.sleep(self.interval)

        # 移除用户连接
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            self.logger.info(f"Connection closed for user {user_id}.")