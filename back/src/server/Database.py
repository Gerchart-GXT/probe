import sqlite3
import json
import threading
from Logger import Logger

class Database:
    def __init__(self, db_path: str, logger: Logger):
        """
        初始化 Database 类。

        :param db_path: SQLite 数据库文件路径
        :param logger: 日志记录器
        """
        self.db_path = db_path
        self.logger = logger
        self.conn = None
        self.cursor = None
        self.lock = threading.Lock()  # 线程锁

    def connect(self):
        """
        连接到 SQLite 数据库。
        """
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            self.logger.info("Connected to SQLite database")
        except sqlite3.Error as e:
            self.logger.error(f"Error connecting to SQLite database: {e}")

    def close(self):
        """
        关闭数据库连接。
        """
        if self.conn:
            self.conn.close()
            self.logger.info("Closed SQLite database connection")

    def create_tables(self):
        """
        创建 `servers` 和 `performance_data` 表。
        """
        with self.lock:  # 加锁
            try:
                # 创建 servers 表
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS servers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        server_name VARCHAR(255) NOT NULL,
                        platform VARCHAR(255) NOT NULL,
                        version VARCHAR(255) NOT NULL,
                        ip_address VARCHAR(15) NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'online',
                        last_seen DATETIME NOT NULL,
                        server_notes TEXT
                    )
                """)

                # 创建 performance_data 表
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS performance_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        server_id INTEGER NOT NULL,
                        timestamp DATETIME NOT NULL,
                        cpu_info TEXT,
                        memory_info TEXT,
                        disk_info TEXT,
                        network_info TEXT,
                        boot_time DATETIME,
                        processes TEXT,
                        FOREIGN KEY (server_id) REFERENCES servers(id)
                    )
                """)

                self.conn.commit()
                self.logger.info("Created tables: servers and performance_data")
            except sqlite3.Error as e:
                self.logger.error(f"Error creating tables: {e}")

    def insert_server(self, server_name: str, platform: str, version: str, ip_address: str, server_notes: str = None):
        """
        插入一条服务器记录。

        :param server_name: 服务器名称
        :param platform: 服务器平台
        :param version: 服务器版本
        :param ip_address: 服务器 IP 地址
        :param server_notes: 服务器备注
        :return: 插入的服务器 ID
        """
        with self.lock:  # 加锁
            try:
                self.cursor.execute("""
                    INSERT INTO servers (server_name, platform, version, ip_address, last_seen, server_notes)
                    VALUES (?, ?, ?, ?, datetime('now'), ?)
                """, (server_name, platform, version, ip_address, server_notes))
                self.conn.commit()
                server_id = self.cursor.lastrowid
                self.logger.info(f"Inserted server record: {server_name} (ID: {server_id})")
                return server_id
            except sqlite3.Error as e:
                self.logger.error(f"Error inserting server record: {e}")
                return None

    def insert_performance_data(self, server_id: int, cpu_info: dict, memory_info: dict, disk_info: list, network_info: dict, boot_time: str, processes: list):
        """
        插入一条性能数据记录。

        :param server_id: 服务器 ID
        :param cpu_info: CPU 信息
        :param memory_info: 内存信息
        :param disk_info: 磁盘信息
        :param network_info: 网络信息
        :param boot_time: 启动时间
        :param processes: 进程信息
        """
        with self.lock:  # 加锁
            try:
                self.cursor.execute("""
                    INSERT INTO performance_data (server_id, timestamp, cpu_info, memory_info, disk_info, network_info, boot_time, processes)
                    VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?)
                """, (server_id, json.dumps(cpu_info), json.dumps(memory_info), json.dumps(disk_info), json.dumps(network_info), boot_time, json.dumps(processes)))
                self.conn.commit()
                self.logger.info(f"Inserted performance data for server ID: {server_id}")
            except sqlite3.Error as e:
                self.logger.error(f"Error inserting performance data: {e}")

    def update_server_status(self, server_id: int, status: str):
        """
        更新服务器状态。

        :param server_id: 服务器 ID
        :param status: 服务器状态
        """
        with self.lock:  # 加锁
            try:
                self.cursor.execute("""
                    UPDATE servers SET status = ?, last_seen = datetime('now') WHERE id = ?
                """, (status, server_id))
                self.conn.commit()
                self.logger.info(f"Updated server status: {status} (ID: {server_id})")
            except sqlite3.Error as e:
                self.logger.error(f"Error updating server status: {e}")