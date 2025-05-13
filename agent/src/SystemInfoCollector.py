import platform
import psutil
from datetime import datetime, timezone
import socket
import json
from collections import deque
from Logger import Logger
import time
from collections import defaultdict, deque

class SystemInfoCollector:
    def __init__(self, logger: Logger):
        self._platform = None
        self._version = None
        self._cpu_info = None
        self._memory_info = None
        self._disk_info = None
        self._network_info = None
        self._boot_time = None
        self._processes = None
        self.logger = logger
        self._network_io_history = defaultdict(deque)  # 用于存储每个网卡的 I/O 历史数据

    def _get_network_io_stats(self):
        self.logger.debug("Get network I/O stats per interface")
        io_counters = psutil.net_io_counters(pernic=True)  # 获取每个网卡的 I/O 统计信息
        current_time = time.time()
        network_io_stats = {}

        for interface, counters in io_counters.items():
            self._network_io_history[interface].append((current_time, counters.bytes_sent, counters.bytes_recv))

            if len(self._network_io_history[interface]) == 2:
                prev_time, prev_sent, prev_recv = self._network_io_history[interface][0]
                curr_time, curr_sent, curr_recv = self._network_io_history[interface][1]

                time_diff = curr_time - prev_time
                sent_diff = curr_sent - prev_sent
                recv_diff = curr_recv - prev_recv

                upload_speed = sent_diff / time_diff  # 上传速度 (bytes/s)
                download_speed = recv_diff / time_diff  # 下载速度 (bytes/s)

                network_io_stats[interface] = {
                    "upload_speed": upload_speed,
                    "download_speed": download_speed,
                    "total_upload": curr_sent,
                    "total_download": curr_recv
                }
            else:
                network_io_stats[interface] = {
                    "upload_speed": 0,
                    "download_speed": 0,
                    "total_upload": counters.bytes_sent,
                    "total_download": counters.bytes_recv
                }

        return network_io_stats

    def _get_network_info(self):
        self.logger.debug("Get network info with I/O stats")
        network = {}
        io_stats = self._get_network_io_stats()  # 获取每个网卡的 I/O 统计信息

        for interface, addrs in psutil.net_if_addrs().items():
            network[interface] = {
                "addresses": [],
                "io_stats": io_stats.get(interface, {})  # 合并 I/O 统计信息
            }
            for addr in addrs:
                if addr.family == socket.AF_INET:
                    network[interface]["addresses"].append({
                        "ip": addr.address,
                        "netmask": addr.netmask,
                        "broadcast": addr.broadcast
                    })

        return network

    def _get_os_version(self):
        self.logger.debug("Get os version")
        if self._platform == "Windows":
            return platform.win32_version()
        elif self._platform == "Linux":
            return platform.release()
        elif self._platform == "Darwin":
            return platform.mac_ver()[0]
        else:
            return "Unknown"

    def _get_cpu_info(self):
        self.logger.debug("Get cpu info")
        return {
            "physical_cores": psutil.cpu_count(logical=False),
            "logical_cores": psutil.cpu_count(logical=True),
            "percent_usage": psutil.cpu_percent(interval=0.1)
        }

    def _get_memory_info(self):
        self.logger.debug("Get memory info")
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "available": mem.available,
            "used": mem.used,
            "percent": mem.percent
        }

    def _get_disk_info(self):
        self.logger.debug("Get disk info")
        disks = []
        for part in psutil.disk_partitions():
            usage = psutil.disk_usage(part.mountpoint)
            disks.append({
                "device": part.device,
                "mountpoint": part.mountpoint,
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
                "percent": usage.percent
            })
        return disks

    def _get_boot_time(self):
        self.logger.debug("Get boot time")
        boot_timestamp = psutil.boot_time()
        local_naive = datetime.fromtimestamp(boot_timestamp)
        local_aware = local_naive.astimezone()
        utc_aware = local_aware.astimezone(timezone.utc)
        formatted_utc = utc_aware.strftime("%Y-%m-%d %H:%M:%S")
        return formatted_utc

    def _get_process_list(self):
        self.logger.debug("Get process list")
        processes = []
        for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
            try:
                processes.append({
                    "pid": proc.info["pid"],
                    "name": proc.info["name"],
                    "cpu_percent": proc.info["cpu_percent"],
                    "memory_percent": proc.info["memory_percent"]
                })
            except psutil.NoSuchProcess:
                continue
        return processes
    
    def update_full_system_info(self):
        self.logger.info("Update full system info")
        self._platform = platform.system()
        self._version = self._get_os_version()
        self._cpu_info = self._get_cpu_info()
        self._memory_info = self._get_memory_info()
        self._disk_info = self._get_disk_info()
        self._network_info = self._get_network_info()
        self._boot_time = self._get_boot_time()
        self._processes = self._get_process_list()

    def get_full_system_info(self):
        self.logger.info("Get full system info")
        return {
            "platform": self._platform,
            "version": self._version,
            "cpu": self._cpu_info,
            "memory": self._memory_info,
            "disk": self._disk_info,
            "network": self._network_info,
            "boot_time": self._boot_time,
            "processes": len(self._processes)
        }