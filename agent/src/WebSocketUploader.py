import json
import websockets
import asyncio
from Logger import Logger

class WebSocketUploader:
    def __init__(self, server_url, secret, logger: Logger):
        self.server_url = server_url
        self.secret = secret
        self.logger = logger
        self.websocket = None  # 用于保存 WebSocket 连接
        self.lock = asyncio.Lock()  # 用于确保线程安全

    async def connect(self):
        """建立 WebSocket 连接"""
        self.logger.info(f"Create Connection to {self.server_url}")
        try:
            self.websocket = await websockets.connect(self.server_url)
            # 发送认证信息
            auth_message = json.dumps({"secret": self.secret})
            await self.websocket.send(auth_message)
            response = await self.websocket.recv()
            self.logger.debug(f"Connect response: {response}")
            if response != "authenticated":
                self.logger.error("Authentication failed")
                await self.close()
                return False
            return True
        except Exception as e:
            self.logger.error(f"WebSocket connection error: {e}")
            await self.close()
            return False

    async def close(self):
        """关闭 WebSocket 连接"""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None

    async def send_data(self, data):
        self.logger.info(f"Upload data to {self.server_url}")
        """发送数据，如果未连接则先建立连接"""
        async with self.lock:  # 确保线程安全
            if not self.websocket:
                if not await self.connect():
                    return False
            try:
                # 发送数据
                message = json.dumps({"secret": self.secret, "data": data})
                await self.websocket.send(message)
                response = await self.websocket.recv()
                self.logger.debug(f"Send response: {response}")
                if response == "ack":
                    self.logger.info("Data sent successfully")
                    return True
                else:
                    self.logger.error(f"Failed to receive acknowledgment: {response}")
                    await self.close()  # 关闭连接以便重试
                    return False
            except Exception as e:
                self.logger.error(f"WebSocket send error: {e}")
                await self.close()  # 关闭连接以便重试
                return False