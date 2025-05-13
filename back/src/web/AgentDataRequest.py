import requests
from typing import List, Dict, Optional
from datetime import datetime
from USDatabase import USDatabase
from Logger import Logger
import requests
from typing import List, Dict, Optional
from datetime import datetime

class AgentDataRequest:
    def __init__(self, server_address: str, server_port: int, db: USDatabase, logger: Logger):
        """
        初始化 AgentDataRequest 类。

        :param server_address: 监控数据收集服务器的地址
        :param server_port: 监控数据收集服务器的端口
        :param db: 数据库实例
        :param logger: 日志记录器实例
        """
        self.server_url = f"http://{server_address}:{server_port}"
        self.db = db
        self.logger = logger

    def request_servers(self) -> Optional[List[Dict]]:
        """
        请求监控数据收集服务器的服务器信息。

        :return: 服务器信息列表
        """
        try:
            response = requests.get(f"{self.server_url}/servers")
            response.raise_for_status()
            servers = response.json()
            self.logger.info("Successfully fetched servers from monitoring server.")
            return servers
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error requesting servers: {e}")
            return None

    def handle_servers(self, servers: List[Dict]) -> List[Dict]:
        """
        处理服务器信息，更新已存在记录的 `last_seen` 字段。

        :param servers: 从监控服务器获取的服务器信息
        :return: 处理后的服务器信息列表
        """
        for server in servers:
            # 更新 `last_seen` 字段
            self.db.execute_query(
                """
                UPDATE servers
                SET last_seen = ?
                WHERE ip_address = ?
                """,
                (server["last_seen"], server["ip_address"])
            )
            self.logger.debug(f"Updated last_seen for server: ip_address={server['ip_address']}")

        return servers

    def insert_servers(self, servers: List[Dict]):
        """
        将服务器信息插入数据库。

        :param servers: 服务器信息列表
        """
        for server in servers:
            self.db.execute_query(
                """
                INSERT INTO servers (
                    server_name, platform, version, ip_address, status, last_seen, server_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    server["server_name"],
                    server["platform"],
                    server["version"],
                    server["ip_address"],
                    server["status"],
                    server["last_seen"],
                    server["server_notes"]
                )
            )
        self.logger.info(f"Inserted {len(servers)} new server records into the database.")

    def fetch_and_store_servers(self):
        """
        从监控服务器获取服务器信息并存储到数据库。
        """
        # 请求服务器信息
        servers = self.request_servers()
        if not servers:
            self.logger.error("No server data fetched.")
            return

        # 处理数据，更新 `last_seen` 字段
        self.handle_servers(servers)

        # 过滤出新服务器（不存在于数据库中的记录）
        new_servers = []
        for server in servers:
            exists = self.db.execute_query(
                "SELECT 1 FROM servers WHERE ip_address = ?",
                (server["ip_address"],),
                fetch=True
            )
            if not exists:
                new_servers.append(server)

        # 插入新数据
        if new_servers:
            self.logger.debug(f"New Server fetch: {new_servers}")
            self.insert_servers(new_servers)
        else:
            self.logger.info("No new server data to insert.")
        return new_servers
        

    def request_performance_data(self, start_time: str, end_time: str) -> Optional[List[Dict]]:
        """
        请求监控数据收集服务器的性能数据。

        :param start_time: 开始时间（格式：'YYYY-MM-DD HH:MM:SS'）
        :param end_time: 结束时间（格式：'YYYY-MM-DD HH:MM:SS'）
        :return: 性能数据列表
        """
        try:
            params = {"start_time": start_time, "end_time": end_time}
            response = requests.get(f"{self.server_url}/performance", params=params)
            response.raise_for_status()
            performance_data = response.json()
            self.logger.info(f"Successfully fetched performance data from {start_time} to {end_time}.")
            return performance_data
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error requesting performance data: {e}")
            return None

    def handle_performance_data(self, performance_data: List[Dict]) -> List[Dict]:
        """
        处理性能数据，过滤掉重复记录。

        :param performance_data: 从监控服务器获取的性能数据
        :return: 去重后的性能数据列表
        """
        new_data = []
        for record in performance_data:
            # 获取服务器 IP 地址
            server_id = record["server_id"]
            server = self.db.execute_query("SELECT ip_address FROM servers WHERE id = ?", (server_id,), fetch=True)
            if not server:
                self.logger.warning(f"Server with ID {server_id} not found in database.")
                continue
            server_ip = server[0]["ip_address"]

            # 检查是否已存在相同记录
            exists = self.db.execute_query(
                """
                SELECT 1 FROM performance_data
                WHERE server_id = ? AND timestamp = ?
                """,
                (server_id, record["timestamp"]),
                fetch=True
            )
            if not exists:
                new_data.append({**record, "server_ip": server_ip})
            else:
                self.logger.debug(f"Duplicate record skipped: server_id={server_id}, timestamp={record['timestamp']}")
        return new_data

    def insert_performance_data(self, performance_data: List[Dict]):
        """
        将性能数据插入数据库。

        :param performance_data: 去重后的性能数据列表
        """
        for record in performance_data:
            self.db.execute_query(
                """
                INSERT INTO performance_data (
                    server_id, timestamp, cpu_info, memory_info, disk_info, network_info, boot_time, processes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record["server_id"],
                    record["timestamp"],
                    record["cpu_info"],
                    record["memory_info"],
                    record["disk_info"],
                    record["network_info"],
                    record["boot_time"],
                    record["processes"]
                )
            )
        self.logger.info(f"Inserted {len(performance_data)} new performance records into the database.")

    def fetch_and_store_performance_data(self, start_time: str, end_time: str):
        """
        从监控服务器获取性能数据并存储到数据库。

        :param start_time: 开始时间（格式：'YYYY-MM-DD HH:MM:SS'）
        :param end_time: 结束时间（格式：'YYYY-MM-DD HH:MM:SS'）
        """
        # 请求性能数据
        performance_data = self.request_performance_data(start_time, end_time)
        # self.logger.debug(f"New performance data is {performance_data}")
        if not performance_data:
            self.logger.error("No performance data fetched.")
            return

        # 处理数据，去重
        new_data = self.handle_performance_data(performance_data)
        if not new_data:
            self.logger.info("No new performance data to insert.")
            return
        # self.logger.debug(f"New performance data fetch: {new_data}")

        # 插入新数据
        self.insert_performance_data(new_data)
        return new_data