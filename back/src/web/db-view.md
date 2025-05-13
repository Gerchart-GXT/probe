### 数据库表设计

#### 1. 用户表 (`users`)
用于存储用户信息，支持JWT登录和注册。

| 字段名         | 数据类型       | 说明                     |
|----------------|----------------|--------------------------|
| `id`           | `INT` (主键)   | 用户唯一标识，自增       |
| `username`     | `VARCHAR(255)` | 用户名，唯一             |
| `password_hash`| `VARCHAR(255)` | 密码的哈希值             |
| `email`        | `VARCHAR(255)` | 用户邮箱，唯一           |
| `created_at`   | `DATETIME`     | 用户注册时间             |

#### 2. 订阅服务器表 (`subscriptions`)
用于存储用户订阅的服务器信息。

| 字段名         | 数据类型       | 说明                     |
|----------------|----------------|--------------------------|
| `id`           | `INT` (主键)   | 订阅记录唯一标识，自增   |
| `user_id`      | `INT`          | 外键，关联 `users` 表    |
| `server_id`    | `INT`          | 外键，关联 `servers` 表  |
| `tags`         | `TEXT`         | 服务器标签（JSON 格式）  |
| `notes`        | `TEXT`         | 服务器备注               |
| `created_at`   | `DATETIME`     | 订阅时间                 |

#### 3. 服务器表 (`servers`)
存储服务器的基本信息，与监控收集服务器的 `servers` 表一致。

| 字段名         | 数据类型       | 说明                     |
|----------------|----------------|--------------------------|
| `id`           | `INT` (主键)   | 服务器唯一标识，自增     |
| `server_name`  | `VARCHAR(255)` | 服务器名称               |
| `platform`     | `VARCHAR(255)` | 服务器平台（如 Linux）   |
| `version`      | `VARCHAR(255)` | 服务器版本               |
| `ip_address`   | `VARCHAR(15)`  | 服务器 IP 地址           |
| `status`       | `VARCHAR(50)`  | 服务器状态（如在线/离线）|
| `last_seen`    | `DATETIME`     | 最后一次心跳时间         |
| `server_notes` | `TEXT`         | 服务器备注               |

#### 4. 性能数据表 (`performance_data`)
存储服务器的性能数据，与监控收集服务器的 `performance_data` 表一致。

| 字段名         | 数据类型       | 说明                     |
|----------------|----------------|--------------------------|
| `id`           | `INT` (主键)   | 性能数据唯一标识，自增   |
| `server_id`    | `INT`          | 外键，关联 `servers` 表  |
| `timestamp`    | `DATETIME`     | 数据时间戳               |
| `cpu_info`     | `TEXT`         | CPU 信息（JSON 格式）    |
| `memory_info`  | `TEXT`         | 内存信息（JSON 格式）    |
| `disk_info`    | `TEXT`         | 磁盘信息（JSON 格式）    |
| `network_info` | `TEXT`         | 网络信息（JSON 格式）    |
| `boot_time`    | `DATETIME`     | 服务器启动时间           |
| `processes`    | `TEXT`         | 进程信息（JSON 格式）    |

---