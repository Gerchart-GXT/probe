import sqlite3
import threading
from typing import List, Dict, Optional, Any
from Logger import Logger

class USDatabase:
    def __init__(self, db_path: str, logger: Logger):
        """
        初始化数据库连接和日志记录器。

        :param db_path: SQLite 数据库文件路径
        :param logger: 日志记录器实例
        """
        self.db_path = db_path
        self.logger = logger
        self.lock = threading.Lock()  # 用于线程安全的锁
        self._initialize_db()

    def _initialize_db(self):
        """
        初始化数据库表结构。
        """
        with self.lock:
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()

                # 创建用户表
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # 创建订阅服务器表
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS subscriptions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        server_id INTEGER NOT NULL,
                        tags TEXT,
                        notes TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        FOREIGN KEY (server_id) REFERENCES servers(id)
                    )
                """)

                # 创建服务器表
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS servers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        server_name VARCHAR(255) NOT NULL,
                        platform VARCHAR(255) NOT NULL,
                        version VARCHAR(255) NOT NULL,
                        ip_address VARCHAR(15) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        last_seen DATETIME NOT NULL,
                        server_notes TEXT
                    )
                """)

                # 创建性能数据表
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS performance_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        server_id INTEGER NOT NULL,
                        timestamp DATETIME NOT NULL,
                        cpu_info TEXT NOT NULL,
                        memory_info TEXT NOT NULL,
                        disk_info TEXT NOT NULL,
                        network_info TEXT NOT NULL,
                        boot_time DATETIME NOT NULL,
                        processes TEXT NOT NULL,
                        FOREIGN KEY (server_id) REFERENCES servers(id)
                    )
                """)

                conn.commit()
                self.logger.info("Database tables initialized successfully.")
            except sqlite3.Error as e:
                self.logger.error(f"Error initializing database: {e}")
            finally:
                if conn:
                    conn.close()

    def execute_query(self, query: str, params: tuple = (), fetch: bool = False) -> Optional[List[Dict]]:
        """
        执行 SQL 查询并返回结果。

        :param query: SQL 查询语句
        :param params: 查询参数
        :param fetch: 是否返回查询结果
        :return: 查询结果（如果 fetch=True）
        """
        with self.lock:
            try:
                conn = sqlite3.connect(self.db_path)
                conn.row_factory = sqlite3.Row  # 返回字典格式的结果
                cursor = conn.cursor()

                cursor.execute(query, params)
                if fetch:
                    result = [dict(row) for row in cursor.fetchall()]
                    self.logger.debug(f"Query executed successfully: {query}")
                    return result
                else:
                    conn.commit()
                    self.logger.debug(f"Query executed successfully: {query}")
            except sqlite3.Error as e:
                self.logger.error(f"Error executing query: {e}")
            finally:
                if conn:
                    conn.close()

    def add_user(self, username: str, password_hash: str, email: str) -> Optional[int]:
        """
        添加新用户。

        :param username: 用户名
        :param password_hash: 密码哈希值
        :param email: 用户邮箱
        :return: 新用户的 ID
        """
        query = """
            INSERT INTO users (username, password_hash, email)
            VALUES (?, ?, ?)
        """
        params = (username, password_hash, email)
        self.execute_query(query, params)
        return self.execute_query("SELECT last_insert_rowid()", fetch=True)[0]["last_insert_rowid()"]

    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """
        根据用户名获取用户信息。

        :param username: 用户名
        :return: 用户信息字典
        """
        query = "SELECT * FROM users WHERE username = ?"
        params = (username,)
        result = self.execute_query(query, params, fetch=True)
        return result[0] if result else None

    def add_subscription(self, user_id: int, server_id: int, tags: str, notes: str) -> Optional[int]:
        """
        添加用户订阅的服务器。

        :param user_id: 用户 ID
        :param server_id: 服务器 ID
        :param tags: 服务器标签
        :param notes: 服务器备注
        :return: 新订阅记录的 ID
        """
        query = """
            INSERT INTO subscriptions (user_id, server_id, tags, notes)
            VALUES (?, ?, ?, ?)
        """
        params = (user_id, server_id, tags, notes)
        self.execute_query(query, params)
        return self.execute_query("SELECT last_insert_rowid()", fetch=True)[0]["last_insert_rowid()"]

    def get_subscriptions_by_user(self, user_id: int) -> List[Dict]:
        """
        获取用户订阅的服务器列表。

        :param user_id: 用户 ID
        :return: 订阅服务器列表
        """
        query = "SELECT * FROM subscriptions WHERE user_id = ?"
        params = (user_id,)
        return self.execute_query(query, params, fetch=True)

    def add_server(self, server_name: str, platform: str, version: str, ip_address: str, status: str, last_seen: str, server_notes: str) -> Optional[int]:
        """
        添加新服务器。

        :param server_name: 服务器名称
        :param platform: 服务器平台
        :param version: 服务器版本
        :param ip_address: 服务器 IP 地址
        :param status: 服务器状态
        :param last_seen: 最后一次心跳时间
        :param server_notes: 服务器备注
        :return: 新服务器的 ID
        """
        query = """
            INSERT INTO servers (server_name, platform, version, ip_address, status, last_seen, server_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        params = (server_name, platform, version, ip_address, status, last_seen, server_notes)
        self.execute_query(query, params)
        return self.execute_query("SELECT last_insert_rowid()", fetch=True)[0]["last_insert_rowid()"]

    def get_servers(self) -> List[Dict]:
        """
        获取所有服务器信息。

        :return: 服务器列表
        """
        query = "SELECT * FROM servers"
        return self.execute_query(query, fetch=True)

    def add_performance_data(self, server_id: int, timestamp: str, cpu_info: str, memory_info: str, disk_info: str, network_info: str, boot_time: str, processes: str) -> Optional[int]:
        """
        添加服务器性能数据。

        :param server_id: 服务器 ID
        :param timestamp: 数据时间戳
        :param cpu_info: CPU 信息
        :param memory_info: 内存信息
        :param disk_info: 磁盘信息
        :param network_info: 网络信息
        :param boot_time: 服务器启动时间
        :param processes: 进程信息
        :return: 新性能数据的 ID
        """
        query = """
            INSERT INTO performance_data (server_id, timestamp, cpu_info, memory_info, disk_info, network_info, boot_time, processes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (server_id, timestamp, cpu_info, memory_info, disk_info, network_info, boot_time, processes)
        self.execute_query(query, params)
        return self.execute_query("SELECT last_insert_rowid()", fetch=True)[0]["last_insert_rowid()"]

    def get_performance_data(self, server_id: int, start_time: str, end_time: str) -> List[Dict]:
        """
        获取指定时间段内服务器的性能数据。

        :param server_id: 服务器 ID
        :param start_time: 开始时间
        :param end_time: 结束时间
        :return: 性能数据列表
        """
        query = """
            SELECT * FROM performance_data
            WHERE server_id = ? AND timestamp BETWEEN ? AND ?
        """
        params = (server_id, start_time, end_time)
        return self.execute_query(query, params, fetch=True)