import sqlite3
import threading
from typing import List, Dict, Optional, Any
from Logger import Logger
import json

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

                # 创建报警信息表
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS alerts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        server_id INTEGER NOT NULL,
                        timestamp DATETIME NOT NULL,
                        cpu_alert TEXT NOT NULL,
                        memory_alert TEXT NOT NULL,
                        disk_alert TEXT NOT NULL,
                        network_alert TEXT NOT NULL,
                        is_valid_alert BOOLEAN NOT NULL,
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

    def add_alert(self, server_id: int, cpu_alert: Dict, memory_alert: Dict, disk_alert: Dict, network_alert: Dict) -> Optional[int]:
        """
        插入一条报警记录。
        :param server_id: 服务器 ID
        :param cpu_alert: CPU 报警信息
        :param memory_alert: 内存报警信息
        :param disk_alert: 磁盘报警信息
        :param network_alert: 网络报警信息
        :return: 新报警记录的 ID
        """
        # 判断是否是有效报警
        is_valid_alert = (
            cpu_alert["alert"] or
            memory_alert["alert"] or
            disk_alert["alert"] or
            network_alert["upload_alert"] or
            network_alert["download_alert"]
        )

        query = """
            INSERT INTO alerts (server_id, timestamp, cpu_alert, memory_alert, disk_alert, network_alert, is_valid_alert)
            VALUES (?, datetime('now'), ?, ?, ?, ?, ?)
        """
        params = (
            server_id,
            json.dumps(cpu_alert),
            json.dumps(memory_alert),
            json.dumps(disk_alert),
            json.dumps(network_alert),
            is_valid_alert,
        )
        self.execute_query(query, params)
        return self.execute_query("SELECT last_insert_rowid()", fetch=True)[0]["last_insert_rowid()"]

    def get_valid_alerts(self, start_time: str, end_time: str) -> List[Dict]:
        """
        查询指定时间内的有效报警记录。
        :param start_time: 开始时间
        :param end_time: 结束时间
        :return: 有效报警记录列表
        """
        query = """
            SELECT * FROM alerts
            WHERE timestamp BETWEEN ? AND ? AND is_valid_alert = 1
        """
        params = (start_time, end_time)
        return self.execute_query(query, params, fetch=True)