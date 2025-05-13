from typing import List, Dict, Optional
from Logger import Logger
from USDatabase import USDatabase

class UserSubHandle:
    def __init__(self, db: USDatabase, logger: Logger):
        """
        初始化 UserSubHandle 类。

        :param db: 数据库实例
        :param logger: 日志记录器实例
        """
        self.db = db
        self.logger = logger

    def get_user_subscriptions(self, user_id: int) -> Dict:
        """
        获取某个用户订阅的服务器列表。

        :param user_id: 用户 ID
        :return: 包含订阅服务器列表的字典，或错误信息
        """
        # 检查用户是否存在
        user = self.db.execute_query("SELECT 1 FROM users WHERE id = ?", (user_id,), fetch=True)
        if not user:
            self.logger.warning(f"User with ID {user_id} not found.")
            return {"status": False, "message": "User not found"}

        # 获取订阅的服务器列表
        subscriptions = self.db.execute_query(
            "SELECT * FROM subscriptions WHERE user_id = ?", (user_id,), fetch=True
        )
        # 将数据转换为字典形式
        subscriptions_dict = [
            {
                "id": sub["id"],
                "user_id": sub["user_id"],
                "server_id": sub["server_id"],
                "tags": sub["tags"].split(",") if sub["tags"] else [],
                "notes": sub["notes"],
                "created_at": sub["created_at"],
            }
            for sub in subscriptions
        ]
        self.logger.info(f"Fetched subscriptions for user ID {user_id}.")
        return {"status": True, "servers": subscriptions_dict}

    def add_subscription(self, user_id: int, server_id: int, tags: List[str], notes: str) -> Dict:
        """
        为某个用户添加某台未订阅服务器。

        :param user_id: 用户 ID
        :param server_id: 服务器 ID
        :param tags: 服务器标签
        :param notes: 服务器备注
        :return: 操作结果（成功或失败信息）
        """
        # 检查用户是否存在
        user = self.db.execute_query("SELECT 1 FROM users WHERE id = ?", (user_id,), fetch=True)
        if not user:
            self.logger.warning(f"User with ID {user_id} not found.")
            return {"status": False, "message": "User not found"}

        # 检查服务器是否存在
        server = self.db.execute_query("SELECT 1 FROM servers WHERE id = ?", (server_id,), fetch=True)
        if not server:
            self.logger.warning(f"Server with ID {server_id} not found.")
            return {"status": False, "message": "Server not found"}

        # 检查是否已订阅
        existing_subscription = self.db.execute_query(
            "SELECT 1 FROM subscriptions WHERE user_id = ? AND server_id = ?",
            (user_id, server_id),
            fetch=True,
        )
        if existing_subscription:
            self.logger.warning(f"User {user_id} already subscribed to server {server_id}.")
            return {"status": False, "message": "Server already subscribed"}

        # 添加订阅
        self.db.execute_query(
            "INSERT INTO subscriptions (user_id, server_id, tags, notes) VALUES (?, ?, ?, ?)",
            (user_id, server_id, ",".join(tags), notes),
        )
        subscription_id = self.db.execute_query("SELECT last_insert_rowid()", fetch=True)[0]["last_insert_rowid()"]
        self.logger.info(f"User {user_id} subscribed to server {server_id} successfully.")
        return {"status": True, "message": "Server subscribed successfully", "subscription_id": subscription_id}

    def delete_subscription(self, subscription_id: int) -> Dict:
        """
        为某个用户删除某台已经添加订阅的服务器。

        :param subscription_id: 订阅记录 ID
        :return: 操作结果（成功或失败信息）
        """
        # 检查订阅记录是否存在
        subscription = self.db.execute_query(
            "SELECT * FROM subscriptions WHERE id = ?", (subscription_id,), fetch=True
        )
        if not subscription:
            self.logger.warning(f"Subscription with ID {subscription_id} not found.")
            return {"status": False, "message": "Subscription not found"}

        # 删除订阅
        self.db.execute_query("DELETE FROM subscriptions WHERE id = ?", (subscription_id,))
        self.logger.info(f"Subscription {subscription_id} deleted successfully.")
        return {"status": True, "message": "Subscription deleted successfully"}
    def update_subscription(self, subscription_id: int, tags: List[str], notes: str) -> Dict:
        """
        更新订阅记录的 tags 和 notes。

        :param subscription_id: 订阅记录 ID
        :param tags: 新的服务器标签
        :param notes: 新的服务器备注
        :return: 操作结果（成功或失败信息）
        """
        # 检查订阅记录是否存在
        subscription = self.db.execute_query(
            "SELECT * FROM subscriptions WHERE id = ?", (subscription_id,), fetch=True
        )
        if not subscription:
            self.logger.warning(f"Subscription with ID {subscription_id} not found.")
            return {"status": False, "message": "Subscription not found"}

        # 更新订阅记录
        self.db.execute_query(
            "UPDATE subscriptions SET tags = ?, notes = ? WHERE id = ?",
            (",".join(tags), notes, subscription_id),
        )
        self.logger.info(f"Subscription {subscription_id} updated successfully.")
        return {"status": True, "message": "Subscription updated successfully"}