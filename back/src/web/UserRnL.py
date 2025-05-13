import jwt
import datetime
from Logger import Logger
from USDatabase import USDatabase
from werkzeug.security import generate_password_hash, check_password_hash
from typing import Optional, Dict

class UserRnL:
    def __init__(self, db: USDatabase, logger: Logger, secret_key: str, token_expiry: int = 3600):
        """
        初始化 UserRnL 类。

        :param db: 数据库实例
        :param logger: 日志记录器实例
        :param secret_key: JWT 密钥
        :param token_expiry: JWT 过期时间（秒，默认 1 小时）
        """
        self.db = db
        self.logger = logger
        self.secret_key = secret_key
        self.token_expiry = token_expiry

    def register_user(self, username: str, password: str, email: str) -> Dict:
        """
        注册新用户。

        :param username: 用户名
        :param password: 密码
        :param email: 用户邮箱
        :return: 注册结果（成功或失败信息）
        """
        # 检查用户名是否已存在
        existing_user = self.db.execute_query(
            "SELECT 1 FROM users WHERE username = ?", (username,), fetch=True
        )
        if existing_user:
            self.logger.warning(f"Username {username} already exists.")
            return {"message": "Username already exists"}

        # 检查邮箱是否已存在
        existing_email = self.db.execute_query(
            "SELECT 1 FROM users WHERE email = ?", (email,), fetch=True
        )
        if existing_email:
            self.logger.warning(f"Email {email} already exists.")
            return {"message": "Email already exists"}

        # 哈希密码
        password_hash = generate_password_hash(password)

        # 插入新用户
        self.db.execute_query(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            (username, password_hash, email),
        )
        self.logger.info(f"User {username} registered successfully.")
        return {"message": "User registered successfully"}

    def login_user(self, username: str, password: str) -> Optional[Dict]:
        """
        用户登录并生成 JWT。

        :param username: 用户名
        :param password: 密码
        :return: 包含 JWT 的字典，或 None（如果登录失败）
        """
        # 获取用户信息
        user = self.db.execute_query(
            "SELECT id, username, password_hash FROM users WHERE username = ?",
            (username,),
            fetch=True,
        )
        if not user:
            self.logger.warning(f"User {username} not found.")
            return None

        user = user[0]
        if not check_password_hash(user["password_hash"], password):
            self.logger.warning(f"Invalid password for user {username}.")
            return None

        # 生成 JWT
        token = jwt.encode(
            {
                "user_id": user["id"],
                "username": user["username"],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=self.token_expiry),
            },
            self.secret_key,
            algorithm="HS256",
        )
        self.logger.info(f"User {username} logged in successfully.")
        return {"access_token": token}