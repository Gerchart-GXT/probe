// src/components/subscription/EditSubscription.jsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateSubscription, unsubscribeFromServer } from '../../api';
import { ErrorMessage } from '../common';
import './EditSubscription.css';

const EditSubscription = ({ subscription, server, onSubscriptionUpdated, onCancel }) => {
  const { user } = useAuth();
  const [tags, setTags] = useState(subscription.tags ? subscription.tags.join(', ') : '');
  const [notes, setNotes] = useState(subscription.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      const response = await updateSubscription(
        subscription.id,
        tagsArray,
        notes,
        user.token
      );
      
      if (response && response.status) {
        onSubscriptionUpdated();
      } else {
        setError('更新订阅失败，请稍后再试');
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.message || '更新订阅时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm('确定要取消订阅此服务器吗？')) return;
    
    try {
      setIsLoading(true);
      
      const response = await unsubscribeFromServer(subscription.id, user.token);
      
      if (response && response.status) {
        onSubscriptionUpdated();
      } else {
        setError('取消订阅失败，请稍后再试');
      }
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(err.message || '取消订阅时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-subscription">
      <h2>编辑服务器订阅</h2>
      
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')} 
        />
      )}
      
      <div className="server-details">
        <h3>{server ? server.name : '未知服务器'}</h3>
        <p>IP地址: {server ? server.ip : 'N/A'}</p>
        <p>平台: {server ? server.platform : 'N/A'}</p>
        <p>状态: {server ? (server.status === 'online' ? '在线' : '离线') : '未知'}</p>
      </div>
      
      <form onSubmit={handleSubmit}>
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
            className="button danger"
            onClick={handleUnsubscribe}
            disabled={isLoading}
          >
            取消订阅
          </button>
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
            {isLoading ? '保存中...' : '保存更改'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSubscription;