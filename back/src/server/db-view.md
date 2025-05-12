#### 1. **服务器表 (`servers`)**  
存储服务器的基本信息。

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

#### 2. **性能数据表 (`performance_data`)**  
存储服务器的性能数据。

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

### **SQL 建表语句**

```sql
-- 服务器表
CREATE TABLE servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_name VARCHAR(255) NOT NULL,
    platform VARCHAR(255) NOT NULL,
    version VARCHAR(255) NOT NULL,
    ip_address VARCHAR(15) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'online',
    last_seen DATETIME NOT NULL,
    server_notes TEXT
);

-- 性能数据表
CREATE TABLE performance_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    timestamp DATETIME NOT NULL,
    cpu_info TEXT,
    memory_info TEXT,
    disk_info TEXT,
    network_info TEXT,
    boot_time DATETIME,
    processes TEXT,
    FOREIGN KEY (server_id) REFERENCES servers(id)
);
```
