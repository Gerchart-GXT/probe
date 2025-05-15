// src/components/alerts/AlertItem.jsx
import React, { useState } from 'react';
import './AlertItem.css';

const AlertItem = ({ alert }) => {
  const [expanded, setExpanded] = useState(false);

  // 直接使用返回的结构，无需 JSON.parse
  const alertData = {
    id: alert.id,
    serverId: alert.server_id,
    timestamp: alert.timestamp,
    cpuAlert: alert.cpu_alert,
    memoryAlert: alert.memory_alert,
    diskAlert: alert.disk_alert,
    networkAlert: alert.network_alert,
    isValidAlert: alert.is_valid_alert,
  };

  // 确定警报优先级
  const getAlertPriority = () => {
    const { cpuAlert, memoryAlert, diskAlert, networkAlert } = alertData;

    // 检查是否有有效警报
    if (!alertData.isValidAlert) return 'low'; // 非有效警报设为低优先级

    // 高优先级条件：任何指标超过阈值
    if (
      cpuAlert.alert ||
      memoryAlert.alert ||
      diskAlert.alert ||
      networkAlert.download_alert ||
      networkAlert.upload_alert
    ) {
      return 'high';
    }

    // 中等优先级：接近阈值但未触发
    const nearThreshold = (
      cpuAlert.current_value > 0.8 * cpuAlert.threshold ||
      memoryAlert.current_value > 0.8 * memoryAlert.threshold ||
      diskAlert.current_value > 0.8 * diskAlert.threshold ||
      networkAlert.current_download > 0.8 * networkAlert.download_threshold ||
      networkAlert.current_upload > 0.8 * networkAlert.upload_threshold
    );

    return nearThreshold ? 'medium' : 'low';
  };

  // 格式化警报摘要
  const getAlertSummary = () => {
    const issues = [];

    if (alertData.cpuAlert.alert) {
      issues.push(`CPU 超过阈值 ${alertData.cpuAlert.current_value.toFixed(1)}%`);
    }

    if (alertData.memoryAlert.alert) {
      issues.push(`内存 超过阈值 ${alertData.memoryAlert.current_value.toFixed(1)}%`);
    }

    if (alertData.diskAlert.alert) {
      issues.push(`磁盘 超过阈值 ${alertData.diskAlert.current_value.toFixed(1)}%`);
    }

    if (alertData.networkAlert.download_alert) {
      const download = (alertData.networkAlert.current_download / 1024 / 1024).toFixed(2);
      issues.push(`下载流量 ${download}MB 超过阈值`);
    }

    if (alertData.networkAlert.upload_alert) {
      const upload = (alertData.networkAlert.current_upload / 1024 / 1024).toFixed(2);
      issues.push(`上传流量 ${upload}MB 超过阈值`);
    }

    return issues.join(' | ');
  };

  const priority = getAlertPriority(alertData);
  const summary = getAlertSummary();

  return (
    <div className={`alert-item priority-${priority} ${expanded ? 'expanded' : ''}`}>
      <div className="alert-header" onClick={() => setExpanded(!expanded)}>
        <div className="alert-info">
          <span className={`alert-priority priority-${priority}`}>
            {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
          </span>
          <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
          <span className="alert-server">服务器 ID: {alertData.serverId}</span>
        </div>
        <div className="alert-summary">
          {summary || '无具体警报信息'}
        </div>
        <div className="alert-expand-icon">
          {expanded ? '▼' : '▶'}
        </div>
      </div>

      {expanded && (
        <div className="alert-details">
          {/* CPU 警报 */}
          {alertData.cpuAlert && (
            <div className="alert-detail-item">
              <h4>CPU 警报</h4>
              <p>当前使用率: <strong>{alertData.cpuAlert.current_value.toFixed(1)}%</strong></p>
              <p>阈值: {alertData.cpuAlert.threshold}%</p>
              <p>是否触发警报: {alertData.cpuAlert.alert ? '是' : '否'}</p>
            </div>
          )}

          {/* 内存警报 */}
          {alertData.memoryAlert && (
            <div className="alert-detail-item">
              <h4>内存警报</h4>
              <p>当前使用率: <strong>{alertData.memoryAlert.current_value.toFixed(1)}%</strong></p>
              <p>阈值: {alertData.memoryAlert.threshold}%</p>
              <p>是否触发警报: {alertData.memoryAlert.alert ? '是' : '否'}</p>
            </div>
          )}

          {/* 磁盘警报 */}
          {alertData.diskAlert && (
            <div className="alert-detail-item">
              <h4>磁盘警报</h4>
              <p>当前使用率: <strong>{alertData.diskAlert.current_value.toFixed(1)}%</strong></p>
              <p>阈值: {alertData.diskAlert.threshold}%</p>
              <p>是否触发警报: {alertData.diskAlert.alert ? '是' : '否'}</p>
            </div>
          )}

          {/* 网络警报 */}
          {alertData.networkAlert && (
            <div className="alert-detail-item">
              <h4>网络警报</h4>
              <p>上传流量: <strong>{(alertData.networkAlert.current_upload / 1e6).toFixed(2)} MB</strong>（阈值: {alertData.networkAlert.upload_threshold / 1e6} MB）</p>
              <p>下载流量: <strong>{(alertData.networkAlert.current_download / 1e6).toFixed(2)} MB</strong>（阈值: {alertData.networkAlert.download_threshold / 1e6} MB）</p>
              <p>上传警报触发: {alertData.networkAlert.upload_alert ? '是' : '否'}</p>
              <p>下载警报触发: {alertData.networkAlert.download_alert ? '是' : '否'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertItem;