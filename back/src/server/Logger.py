import logging
from logging.handlers import RotatingFileHandler
from typing import Optional, Dict

class Logger:
    def __init__(
        self,
        name: str = "app",
        log_file: Optional[str] = None,
        log_level: int = logging.INFO,
        console: bool = True,
        file_rotation: Optional[Dict] = None,
        formatter: Optional[str] = None,
    ):
        """
        初始化日志包装器

        :param name: 日志器名称
        :param log_file: 日志文件路径（None 表示不写入文件）
        :param log_level: 日志级别（如 logging.INFO）
        :param console: 是否输出到控制台
        :param file_rotation: 日志轮转配置（格式：{'maxBytes': 1024*1024*5, 'backupCount': 3}）
        :param formatter: 自定义日志格式字符串
        """

        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)

        # 设置 formatter
        if formatter:
            self.formatter = logging.Formatter(formatter)
        else:
            self.formatter = logging.Formatter(
                "[%(asctime)s] [%(levelname)s] [%(module)s] [%(funcName)s] - %(message)s"
            )

        # 添加控制台 handler
        if console:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(self.formatter)
            self.logger.addHandler(console_handler)

        # 添加文件 handler（带轮转）
        if log_file:
            if file_rotation:
                max_bytes = file_rotation.get("maxBytes", 1024 * 1024 * 5)
                backup_count = file_rotation.get("backupCount", 3)
                file_handler = RotatingFileHandler(
                    log_file, maxBytes=max_bytes, backupCount=backup_count
                )
            else:
                file_handler = logging.FileHandler(log_file)

            file_handler.setFormatter(self.formatter)
            self.logger.addHandler(file_handler)

        # 保证每个 logger 只添加一次 handler
        self.logger.propagate = False

    def get_logger(self, context: Optional[Dict] = None) -> logging.LoggerAdapter:
        """
        获取带有上下文信息的 LoggerAdapter

        :param context: 上下文信息（如 user_id: "12345"）
        :return: LoggerAdapter 实例
        """
        return logging.LoggerAdapter(self.logger, context or {})

    def info(self, message: str, context: Optional[Dict] = None):
        self.get_logger(context).info(message)

    def debug(self, message: str, context: Optional[Dict] = None):
        self.get_logger(context).debug(message)

    def warning(self, message: str, context: Optional[Dict] = None):
        self.get_logger(context).warning(message)

    def error(self, message: str, context: Optional[Dict] = None):
        self.get_logger(context).error(message)

    def critical(self, message: str, context: Optional[Dict] = None):
        self.get_logger(context).critical(message)