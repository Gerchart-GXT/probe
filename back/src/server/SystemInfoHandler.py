import asyncio
import json
from Logger import Logger
from ASDatebase import ASDatabase  # 假设 Database 类在 Database.py 文件中

class SystemInfoHandler:
    def __init__(self, data_queue: asyncio.Queue, db_path: str, logger: Logger):
        """
        初始化 SystemInfoHandler。

        :param data_queue: 用于接收系统信息数据的 asyncio.Queue
        :param db_path: SQLite 数据库文件路径
        :param logger: 日志记录器
        """
        self.data_queue = data_queue
        self.db_path = db_path
        self.logger = logger
        self.db = ASDatabase(db_path=self.db_path, logger=self.logger)

    async def process_data(self):
        """
        从队列中获取数据并存储到数据库中。
        """
        self.db.connect()  # 连接到数据库
        while True:
            # 从队列中获取数据（阻塞操作）
            data = await self.data_queue.get()
            self.logger.debug(f"Processing data: {data}")

            try:
                # 插入或更新服务器记录
                server_id = self._insert_or_update_server(data)

                # 插入性能数据记录
                self._insert_performance_data(server_id, data)
            except Exception as e:
                self.logger.error(f"Error processing data: {e}")

    def _insert_or_update_server(self, data) -> int:
        """
        插入或更新服务器记录。

        :param data: 系统信息数据
        :return: 服务器 ID
        """
        # 从网络信息中提取 IP 地址
        ip_address = self._get_ip_address(data["network"])

        # 检查服务器是否已存在
        self.db.cursor.execute("SELECT id FROM servers WHERE ip_address = ?", (ip_address,))
        result = self.db.cursor.fetchone()

        if result:
            # 如果服务器已存在，更新状态和最后心跳时间
            server_id = result[0]
            self.db.update_server_status(server_id=server_id, status="online")
            self.logger.info(f"Updated server status: {ip_address} (ID: {server_id})")
        else:
            # 如果服务器不存在，插入新记录
            server_id = self.db.insert_server(
                server_name=f"Server-{ip_address}",  # 默认服务器名称为 "Server-IP"
                platform=data["platform"],
                version=data["version"],
                ip_address=ip_address,
                server_notes=data.get("server_notes")
            )
            self.logger.info(f"Inserted new server: {ip_address} (ID: {server_id})")

        return server_id

    def _insert_performance_data(self, server_id: int, data):
        """
        插入性能数据记录。

        :param server_id: 服务器 ID
        :param data: 系统信息数据
        """
        self.db.insert_performance_data(
            server_id=server_id,
            cpu_info=data["cpu"],
            memory_info=data["memory"],
            disk_info=data["disk"],
            network_info=data["network"],
            boot_time=data["boot_time"],
            processes=data["processes"]
        )
        self.logger.info(f"Inserted performance data for server ID: {server_id}")

    def _get_ip_address(self, network_info: dict) -> str:
        """
        从网络信息中提取 IP 地址。

        :param network_info: 网络信息字典
        :return: IP 地址
        """
        for interface, addrs in network_info.items():
            for addr in addrs:
                if addr.get("ip") and addr["ip"] != "127.0.0.1":  # 忽略本地回环地址
                    return addr["ip"]
        return "0.0.0.0"  # 如果没有找到 IP 地址，返回默认值

    def run(self):
        """
        运行数据处理任务。
        """
        asyncio.get_event_loop().run_until_complete(self.process_data())