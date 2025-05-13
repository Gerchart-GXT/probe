from flask import Flask, render_template
from flask_socketio import SocketIO, send
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room

# 创建 Flask 应用
app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = 'your_secret_key'

# 创建 SocketIO 实例
socketio = SocketIO(app)

# 定义路由
@app.route('/')
def index():
    return render_template('index.html')

# 定义 WebSocket 事件处理函数
@socketio.on('message')
def handle_message(message):
    print('Received message: ' + message)
    send('Echo: ' + message, broadcast=True)

# 运行应用
if __name__ == '__main__':
    socketio.run(app, debug=True)