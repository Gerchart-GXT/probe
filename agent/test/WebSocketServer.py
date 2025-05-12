import asyncio
import websockets
import json

async def handle_connection(websocket):
    try:
        # 接收认证信息
        auth_message = await websocket.recv()
        auth_data = json.loads(auth_message)
        if auth_data.get("secret") == "your_secret_key":
            await websocket.send("authenticated")  # 发送认证成功消息
        else:
            await websocket.send("invalid_secret")  # 发送认证失败消息
            return

        # 保持连接并处理后续消息
        async for message in websocket:
            data = json.loads(message)
            print("Received data:", data["data"])
            await websocket.send("ack")  # 发送确认
    except Exception as e:
        print(f"Error: {e}")

async def main():
    async with websockets.serve(handle_connection, "localhost", 9999):
        await asyncio.Future()  # 保持服务器运行

if __name__ == "__main__":
    asyncio.run(main())