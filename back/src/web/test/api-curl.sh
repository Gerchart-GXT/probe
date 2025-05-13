curl -X POST http://localhost:7777/api/register \
-H "Content-Type: application/json" \
-d '{"username": "user1", "password": "password123", "email": "user1@example.com"}'

curl -X POST http://localhost:7777/api/login \
-H "Content-Type: application/json" \
-d '{"username": "user1", "password": "password123"}'

curl -X GET "http://localhost:7777/api/subscriptions?user_id=1"

curl -X POST http://localhost:7777/api/subscriptions \
-H "Content-Type: application/json" \
-d '{"user_id": 1, "server_id": 1, "tags": ["web", "db"], "notes": "Main server"}'

curl -X DELETE http://localhost:7777/api/subscriptions/1

curl -X PUT http://localhost:7777/api/subscriptions/2 \
-H "Content-Type: application/json" \
-d '{"tags": ["fuck", "me", "please"], "notes": "Updated notes"}'