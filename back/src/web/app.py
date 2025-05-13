from Logger import Logger
import logging
from USDatabase import USDatabase
from AgentDataRequest import AgentDataRequest
from UserRnL import UserRnL
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room
from UserSubHandle import UserSubHandle
from RealTimeDataSend import RealTimeDataSend
import threading
import time
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

AS_HOST = "0.0.0.0"  # 监控数据收集服务器绑定的主机地址
AS_PORT = 8888       # 监控数据收集服务器绑定的端口
SECRET = "your_secret_key"  # 用于JWT的密钥
DB_PATH = "user-server.db"  # SQLite 数据库文件路径
FLASK_HOST = "0.0.0.0"  # Flask 服务器绑定的主机地址
FLASK_PORT = 7777       # Flask 服务器绑定的端口

AGENT_DATA_UPDATE_INT = 3

# 初始化日志记录器
LOG_CONFIG = {
    "name": "my_app",
    "log_file": "app.log",
    "log_level": logging.DEBUG,
    "console": True,
    "file_rotation": {
        "maxBytes": 1024 * 1024 * 10,
        "backupCount": 5
    },
    "formatter": "[%(asctime)s]-[%(levelname)s]: %(message)s"
}

# 创建 Logger 实例
logger = Logger(**LOG_CONFIG)

# 初始化数据库
db = USDatabase(DB_PATH, logger)

agent = AgentDataRequest(AS_HOST, AS_PORT, db, logger)

# 获取并存储性能数据
# start_time = "2023-10-01 00:00:00"
# end_time = "2025-10-01 23:59:59"
# agent.fetch_and_store_servers()
# agent.fetch_and_store_performance_data(start_time, end_time)

def agent_data_update():
    """后台数据获取任务（每5分钟执行一次）"""
    while True:
        try:
            # 获取并存储服务器信息
            agent.fetch_and_store_servers()
            

            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(seconds=AGENT_DATA_UPDATE_INT)
            start_str = start_time.strftime("%Y-%m-%d %H:%M:%S")
            end_str = end_time.strftime("%Y-%m-%d %H:%M:%S")
            agent.fetch_and_store_servers()
            agent.fetch_and_store_performance_data(start_str, end_str)
            
            logger.info(f"Agent data updating finished, next updating time is {end_time + timedelta(seconds=AGENT_DATA_UPDATE_INT)}")
        except Exception as e:
            logger.error(f"Agent data updating failed: {e}")
        time.sleep(AGENT_DATA_UPDATE_INT)

# 初始化 RealTimeDataSend
real_time_data_send = RealTimeDataSend(db, logger, socketio)

# WebSocket 连接事件
@socketio.on("connect")
def handle_connect():
    user_id = request.args.get("user_id")
    if not user_id:
        logger.warning("No user_id provided in WebSocket connection.")
        return False

    # 加入用户专属的房间
    join_room(str(user_id))
    logger.info(f"User {user_id} connected to WebSocket.")

    # 启动数据发送
    real_time_data_send.start_sending_data(int(user_id))

# WebSocket 断开连接事件
@socketio.on("disconnect")
def handle_disconnect():
    logger.debug("connect")
    user_id = request.args.get("user_id")
    if not user_id:
        logger.warning("No user_id provided in WebSocket disconnection.")
        return

    # 离开用户专属的房间
    leave_room(str(user_id))
    logger.info(f"User {user_id} disconnected from WebSocket.")

    # 停止数据发送
    real_time_data_send.stop_sending_data(int(user_id))

# 初始化 UserRnL
user_rnl = UserRnL(db, logger, secret_key=SECRET)

# 用户注册接口
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if not username or not password or not email:
        return jsonify({"message": "Username, password, and email are required"}), 400

    result = user_rnl.register_user(username, password, email)
    if "message" in result:
        return jsonify(result), 200 if result["message"] == "User registered successfully" else 400
    else:
        return jsonify({"message": "Registration failed"}), 500

# 用户登录接口
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    result = user_rnl.login_user(username, password)
    if result:
        return jsonify(result), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401

# 初始化 UserSubHandle
user_sub_handle = UserSubHandle(db, logger)

# 获取用户订阅的服务器列表
@app.route("/api/subscriptions", methods=["GET"])
def get_subscriptions():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"status": False, "message": "user_id is required"}), 400

    result = user_sub_handle.get_user_subscriptions(int(user_id))
    return jsonify(result), 200 if result["status"] else 400

# 订阅新的服务器
@app.route("/api/subscriptions", methods=["POST"])
def add_subscription():
    data = request.get_json()
    user_id = data.get("user_id")
    server_id = data.get("server_id")
    tags = data.get("tags", [])
    notes = data.get("notes", "")

    if not user_id or not server_id:
        return jsonify({"status": False, "message": "user_id and server_id are required"}), 400

    result = user_sub_handle.add_subscription(int(user_id), int(server_id), tags, notes)
    return jsonify(result), 200 if result["status"] else 400

# 取消订阅服务器
@app.route("/api/subscriptions/<int:subscription_id>", methods=["DELETE"])
def delete_subscription(subscription_id):
    result = user_sub_handle.delete_subscription(subscription_id)
    return jsonify(result), 200 if result["status"] else 400

# 更新订阅记录的 tags 和 notes
@app.route("/api/subscriptions/<int:subscription_id>", methods=["PUT"])
def update_subscription(subscription_id):
    data = request.get_json()
    tags = data.get("tags", [])
    notes = data.get("notes", "")

    if not tags and not notes:
        return jsonify({"status": False, "message": "tags or notes are required"}), 400

    result = user_sub_handle.update_subscription(subscription_id, tags, notes)
    return jsonify(result), 200 if result["status"] else 400



# 启动 Flask 应用
if __name__ == "__main__":
    agent_data_update_thread = threading.Thread(target=agent_data_update)
    agent_data_update_thread.daemon = True  # 设置为守护线程（随主线程退出）
    agent_data_update_thread.start()
    socketio.run(app, host=FLASK_HOST, port=FLASK_PORT, debug=True)
