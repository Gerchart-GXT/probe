import json
import logging
from typing import Dict, Optional
from USDatabase import USDatabase
class PerformanceMonitor:
    def __init__(self, logger: logging.Logger, db: USDatabase, config_path: str):
        """
        初始化 PerformanceMonitor 类。

        :param logger: 日志记录器实例
        :param db: 数据库实例
        :param config_path: 阈值配置文件的路径
        """
        self.logger = logger
        self.db = db
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: str) -> Dict:
        """
        从 JSON 文件加载阈值配置。

        :param config_path: 配置文件路径
        :return: 阈值配置字典
        """
        try:
            with open(config_path, "r") as f:
                config = json.load(f)
            self.logger.info("Threshold configuration loaded successfully.")
            return config
        except Exception as e:
            self.logger.error(f"Failed to load threshold configuration: {e}")
            raise

    def check_cpu(self, cpu_info: str) -> Dict:
        """
        检查 CPU 使用率是否超过阈值。

        :param cpu_info: CPU 信息（JSON 字符串）
        :return: 包含是否预警、当前值和阈值的字典
        """
        cpu_data = json.loads(cpu_info)
        cpu_usage = cpu_data.get("percent_usage", 0)
        threshold = self.config.get("cpu_threshold", 80)
        return {
            "alert": cpu_usage > threshold,
            "current_value": cpu_usage,
            "threshold": threshold,
        }

    def check_memory(self, memory_info: str) -> Dict:
        """
        检查内存使用率是否超过阈值。

        :param memory_info: 内存信息（JSON 字符串）
        :return: 包含是否预警、当前值和阈值的字典
        """
        memory_data = json.loads(memory_info)
        memory_usage = memory_data.get("percent", 0)
        threshold = self.config.get("memory_threshold", 80)
        return {
            "alert": memory_usage > threshold,
            "current_value": memory_usage,
            "threshold": threshold,
        }

    def check_disk(self, disk_info: str) -> Dict:
        """
        检查磁盘使用率是否超过阈值。

        :param disk_info: 磁盘信息（JSON 字符串）
        :return: 包含是否预警、当前值和阈值的字典
        """
        disk_data = json.loads(disk_info)
        max_disk_usage = max(disk.get("percent", 0) for disk in disk_data)
        threshold = self.config.get("disk_threshold", 80)
        return {
            "alert": max_disk_usage > threshold,
            "current_value": max_disk_usage,
            "threshold": threshold,
        }

    def check_network(self, network_info: str) -> Dict:
        """
        检查网络带宽和总流量是否超过阈值。

        :param network_info: 网络信息（JSON 字符串）
        :return: 包含是否预警、当前值和阈值的字典
        """
        network_data = json.loads(network_info)
        total_upload = sum(iface["io_stats"]["total_upload"] for iface in network_data.values())
        total_download = sum(iface["io_stats"]["total_download"] for iface in network_data.values())
        upload_threshold = self.config.get("upload_threshold", 1024 * 1024 * 1024)  # 默认 1GB
        download_threshold = self.config.get("download_threshold", 1024 * 1024 * 1024)  # 默认 1GB

        return {
            "upload_alert": total_upload > upload_threshold,
            "download_alert": total_download > download_threshold,
            "current_upload": total_upload,
            "current_download": total_download,
            "upload_threshold": upload_threshold,
            "download_threshold": download_threshold,
        }

    def monitor_performance(self, performance_data: Dict) -> Dict:
        """
        监控服务器的性能数据，并返回每个参数的预警状态。

        :param performance_data: 服务器性能数据
        :return: 包含每个参数预警状态的字典
        """
        result = {
            "cpu": self.check_cpu(performance_data["cpu_info"]),
            "memory": self.check_memory(performance_data["memory_info"]),
            "disk": self.check_disk(performance_data["disk_info"]),
            "network": self.check_network(performance_data["network_info"]),
        }
        self.logger.info("Performance monitoring completed.")
        return result

    def save_alert_to_db(self, performance_data: Dict) -> Optional[int]:
        """
        将监控结果存入数据库。

        :param performance_data: 服务器性能数据
        :return: 新报警记录的 ID
        """
        # 从性能数据中获取 server_id
        server_id = performance_data["server_id"]

        # 监控性能数据
        alert_result = self.monitor_performance(performance_data)

        # 将监控结果存入数据库
        alert_id = self.db.add_alert(
            server_id=server_id,
            cpu_alert=alert_result["cpu"],
            memory_alert=alert_result["memory"],
            disk_alert=alert_result["disk"],
            network_alert=alert_result["network"],
        )
        self.logger.info(f"Alert saved to database with ID: {alert_id}")
        return alert_id