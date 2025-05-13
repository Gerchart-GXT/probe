import socketio
import logging
import time

# 配置日志
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# 初始化 Socket.IO 客户端
sio = socketio.Client()

@sio.event
def connect():
    logger.info("Connected to WebSocket server.")
    sio.emit("ready", {"timestamp": time.time()})

@sio.event
def disconnect():
    logger.info("Disconnected from WebSocket server.")

@sio.event
def server_data(data):
    logger.info(f"Received data: {data}")
    # 可以解构数据
    user_id = data.get('user_id')
    server_data = data.get('data')
    logger.info(f"User ID: {user_id}, Server Data: {server_data}")

if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python websocket_client.py <user_id>")
        sys.exit(1)

    user_id = int(sys.argv[1])
    server_url = f"http://localhost:7777/socket.io/?user_id={user_id}"

    try:
        sio.connect(server_url)
        sio.wait()  # 保持连接
    except Exception as e:
        logger.error(f"Failed to connect to WebSocket server: {e}")