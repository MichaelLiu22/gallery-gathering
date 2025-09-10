# 好友系统设计文档

## 概述
本系统实现了类似小红书的好友系统，支持发送好友请求、接受/拒绝请求、好友列表管理等功能。

## 数据库结构

### 表结构

#### friend_requests (好友请求表)
```sql
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### friendships (好友关系表)
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 索引优化
```sql
-- 好友请求索引
CREATE INDEX idx_friend_requests_receiver_status 
ON friend_requests(receiver_id, status) WHERE status = 'pending';

CREATE INDEX idx_friend_requests_sender_status 
ON friend_requests(sender_id, status) WHERE status = 'pending';

-- 好友关系索引  
CREATE INDEX idx_friendships_user_friend_status 
ON friendships(user_id, friend_id, status) WHERE status = 'accepted';

CREATE INDEX idx_friendships_friend_user_status 
ON friendships(friend_id, user_id, status) WHERE status = 'accepted';
```

### RLS 安全策略
```sql
-- friend_requests 表的 RLS 策略
CREATE POLICY "Users can create friend requests" ON friend_requests
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their own friend requests" ON friend_requests
FOR SELECT USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

CREATE POLICY "Users can update received friend requests" ON friend_requests
FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own friend requests" ON friend_requests
FOR DELETE USING (auth.uid() = sender_id);

-- friendships 表的 RLS 策略
CREATE POLICY "Users can view their own friendships" ON friendships
FOR SELECT USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can create friendships and accept friend requests" ON friendships
FOR INSERT WITH CHECK ((auth.uid() = user_id) OR (EXISTS (
  SELECT 1 FROM friend_requests 
  WHERE receiver_id = auth.uid() 
  AND sender_id = friendships.user_id 
  AND status = 'pending'
)));

CREATE POLICY "Users can update their own friendships" ON friendships
FOR UPDATE USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can delete their own friendships" ON friendships
FOR DELETE USING (auth.uid() = user_id);
```

## RPC 函数

### 1. rpc_friend_request_create
发送好友请求

**参数:** 
- `receiver_uuid`: UUID - 接收者用户ID

**返回:** JSON
```json
{
  "success": true,
  "request_id": "uuid"
}
```

**调用示例:**
```javascript
const { data, error } = await supabase.rpc('rpc_friend_request_create', {
  receiver_uuid: 'user-uuid-here'
});
```

### 2. rpc_friend_request_respond
响应好友请求

**参数:**
- `request_uuid`: UUID - 请求ID
- `action`: TEXT - 'accept' 或 'reject'

**返回:** JSON
```json
{
  "success": true,
  "action": "accepted",
  "friendship_id": "uuid"
}
```

**调用示例:**
```javascript
// 接受请求
const { data, error } = await supabase.rpc('rpc_friend_request_respond', {
  request_uuid: 'request-uuid',
  action: 'accept'
});

// 拒绝请求
const { data, error } = await supabase.rpc('rpc_friend_request_respond', {
  request_uuid: 'request-uuid', 
  action: 'reject'
});
```

### 3. rpc_friend_remove
移除好友关系

**参数:**
- `friend_uuid`: UUID - 好友用户ID

**返回:** JSON
```json
{
  "success": true,
  "message": "Friendship removed"
}
```

**调用示例:**
```javascript
const { data, error } = await supabase.rpc('rpc_friend_remove', {
  friend_uuid: 'friend-uuid-here'
});
```

### 4. rpc_friend_list
获取好友列表

**参数:** 无

**返回:** TABLE
```sql
friend_id UUID,
display_name TEXT,
avatar_url TEXT,  
photo_score NUMERIC,
friendship_created_at TIMESTAMPTZ
```

**调用示例:**
```javascript
const { data, error } = await supabase.rpc('rpc_friend_list');
```

## 实时更新

系统启用了 Realtime 功能，可以实时监听好友请求和好友关系的变化：

```javascript
// 监听好友相关表的变化
const channel = supabase
  .channel('friends-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'friendships'
  }, (payload) => {
    // 处理好友关系变化
    console.log('Friendship changed:', payload);
  })
  .on('postgres_changes', {
    event: '*', 
    schema: 'public',
    table: 'friend_requests'
  }, (payload) => {
    // 处理好友请求变化
    console.log('Friend request changed:', payload);
  })
  .subscribe();
```

## 前端集成

### React Hooks

系统提供了以下 React Hooks：

- `useFriends()` - 获取好友列表，自动订阅实时更新
- `useFriendRequests()` - 获取好友请求列表  
- `useSendFriendRequest(receiverId)` - 发送好友请求
- `useAcceptFriendRequest(requestId)` - 接受好友请求
- `useRejectFriendRequest(requestId)` - 拒绝好友请求  
- `useRemoveFriend(friendId)` - 移除好友

### 使用示例

```javascript
import { useFriends, useSendFriendRequest } from '@/hooks/useFriends';

function FriendsList() {
  const { data: friends, isLoading } = useFriends();
  const sendRequest = useSendFriendRequest('target-user-id');

  const handleSendRequest = () => {
    sendRequest.mutate();
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {friends?.map(friend => (
        <div key={friend.friend_id}>
          {friend.friend_profile.display_name}
          <span>评分: {friend.friend_profile.photo_score}</span>
        </div>
      ))}
    </div>
  );
}
```

## 安全考虑

1. **严格的 RLS 策略**: 确保用户只能访问自己相关的数据
2. **RPC 函数安全**: 所有 RPC 函数都验证用户身份和权限
3. **防止重复请求**: 自动检查已存在的好友关系和待处理请求
4. **防止自己添加自己**: RPC 函数会检查并阻止用户添加自己为好友

## 性能优化

1. **复合索引**: 针对常用查询建立了优化索引
2. **RPC 批量操作**: 减少数据库往返次数
3. **实时更新**: 避免频繁轮询，使用 Supabase Realtime
4. **查询优化**: 使用联表查询一次性获取所需数据