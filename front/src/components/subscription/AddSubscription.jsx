// src/components/subscription/AddSubscription.jsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToServer } from '../../api';
import { ErrorMessage } from '../common';
import './AddSubscription.css';

const AddSubscription = ({ availableServers, onSubscriptionAdded, onCancel }) => {
  const { user } = useAuth();
  const [serverId, setServerId] = useState(availableServers.length > 0 ? availableServers[0].id : '');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serverId) {
      setError('请选择一个服务器');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      const response = await subscribeToServer(
        user.id,
        parseInt(serverId),
        tagsArray,
        notes,
        user.token
      );
      
      if (response && response.status) {
        onSubscriptionAdded();
      } else {
        setError('添加订阅失败，请稍后再试');
      }
    } catch (err) {
      console.error('Error adding subscription:', err);
      setError(err.message || '添加订阅时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  if (availableServers.length === 0) {
    return (
      <div className="add-subscription">
        <h2>添加新订阅</h2>
        <div className="no-servers-message">
          <p>没有可用的服务器。所有服务器已被订阅。</p>
          <button
            className="button secondary"
            onClick={onCancel}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="add-subscription">
      <h2>添加新订阅</h2>
      
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')} 
        />
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="server">选择服务器</label>
          <select
            id="server"
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
            disabled={isLoading}
            required
          >
            {availableServers.map(server => (
              <option key={server.id} value={server.id}>
                {server.name} ({server.ip}) - {server.status === 'online' ? '在线' : '离线'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">标签 (用逗号分隔)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如: 生产, 重要, 数据库"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">备注</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="添加关于此服务器的备注"
            disabled={isLoading}
            rows={3}
          />
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={isLoading}
          >
            {isLoading ? '添加中...' : '添加订阅'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubscription;