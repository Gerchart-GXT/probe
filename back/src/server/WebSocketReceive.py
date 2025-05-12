import asyncio
import websockets
import json
from Logger import Logger

class WebSocketReceive:
    def __init__(self, host: str, port: int, secret: str, data_queue: asyncio.Queue, logger: Logger):
        """
        初始化 WebSocket 服务器。

        :param host: WebSocket 服务器绑定的主机地址
        :param port: WebSocket 服务器绑定的端口
        :param secret: 用于验证客户端的密钥
        :param data_queue: 用于存储接收到的数据的 asyncio.Queue
        :param logger: 日志记录器
        """
        self.host = host
        self.port = port
        self.secret = secret
        self.data_queue = data_queue
        self.logger = logger

    async def _handle_connection(self, websocket):
        """
        处理 WebSocket 连接。

        :param websocket: WebSocket 连接对象
        :param path: 请求路径
        """
        self.logger.info(f"New connection from {websocket.remote_address}")
        try:
            # 接收认证信息
            auth_message = await websocket.recv()
            auth_data = json.loads(auth_message)
            self.logger.debug(auth_data.get("secret"))
            if auth_data.get("secret") != self.secret:
                self.logger.error(f"Authentication failed from {websocket.remote_address}")
                await websocket.send("authentication_failed")
                await websocket.close()
                return

            # 认证成功
            await websocket.send("authenticated")
            self.logger.info(f"Client {websocket.remote_address} authenticated")

            # 接收数据
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get("secret") != self.secret:
                        self.logger.error(f"Invalid secret from {websocket.remote_address}")
                        await websocket.send("invalid_secret")
                        continue

                    # 将数据推入队列
                    await self.data_queue.put(data["data"])
                    self.logger.debug(f"Received data from {websocket.remote_address}: {data['data']}")

                    # 发送确认
                    await websocket.send("ack")
                except json.JSONDecodeError:
                    self.logger.error(f"Invalid JSON message from {websocket.remote_address}")
                    await websocket.send("invalid_json")
                except Exception as e:
                    self.logger.error(f"Error processing message from {websocket.remote_address}: {e}")
                    await websocket.send("error")

        except websockets.exceptions.ConnectionClosed:
            self.logger.info(f"Client {websocket.remote_address} disconnected")
        except Exception as e:
            self.logger.error(f"Error handling connection from {websocket.remote_address}: {e}")

    async def start(self):
        """
        启动 WebSocket 服务器。
        """
        server = await websockets.serve(
            self._handle_connection, self.host, self.port
        )
        self.logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
        await server.wait_closed()

    def run(self):
        """
        运行 WebSocket 服务器。
        """
        asyncio.get_event_loop().run_until_complete(self.start())