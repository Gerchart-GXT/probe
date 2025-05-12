from Logger import Logger
import logging
from SystemInfoCollector import SystemInfoCollector

import asyncio
import json
import threading
import time
from collections import deque
from SystemInfoCollector import SystemInfoCollector
from WebSocketUploader import WebSocketUploader

class MainApp:
    def __init__(self, config_file, logger:Logger):
        self.logger = logger
        self.logger.info("Read config file")
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        self.message_queue = asyncio.Queue(maxsize=1) # 定长队列
        self.logger.info("Init SystemInfoCollector")
        self.collector = SystemInfoCollector(self.logger)
        self.logger.info("Init WebSocketUploader")
        self.ws_client = WebSocketUploader(self.config['server_url'], self.config['secret'], self.logger)

    async def collect_info(self):
        while True:
            self.logger.info("Collent sys info")
            self.collector.update_full_system_info()
            system_info = self.collector.get_full_system_info()
            self.logger.info("Push sys info")
            await self.message_queue.put(system_info)
            await asyncio.sleep(self.config['collect_interval'])

    async def upload_info(self):
        """从队列中取出数据并发送"""
        while True:
            self.logger.info("Pop sys info")
            data = await self.message_queue.get()
            self.logger.info("Sent sys info")
            await self.ws_client.send_data(data)
            await asyncio.sleep(self.config['upload_interval'])

    async def run(self):
        """运行所有任务"""
        self.logger.info("Agent Start")
        await asyncio.gather(
            self.collect_info(),
            self.upload_info()
        )

LOG_CONFIG = {
    "name": "my_app",
    "log_file": "app.log",
    "log_level": logging.INFO,
    "console": True,
    "file_rotation": {
        "maxBytes": 1024 * 1024 * 10,
        "backupCount": 5
    },
    "formatter": "[%(asctime)s]-[%(levelname)s]: %(message)s"
}

def main():
    logger = Logger(**LOG_CONFIG)
    app = MainApp('config.json', logger)
    asyncio.run(app.run())
    # info_collector.update_full_system_info()
    # print(info_collector.get_full_system_info())


if __name__ == "__main__":
    main()