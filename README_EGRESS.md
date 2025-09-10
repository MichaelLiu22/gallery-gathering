# Supabase 降本优化方案

## 概述
本方案通过实施缩略图生成、私有存储桶、签名URL等技术手段，有效降低 Supabase Cached Egress 使用量，控制成本支出。

## 主要优化措施

### 1. 存储桶私有化
将原本的公开存储桶改为私有，避免直接访问导致的流量消耗。

```sql
-- 将 photos 存储桶设为私有
UPDATE storage.buckets SET public = false WHERE id = 'photos';

-- 创建私有存储桶
INSERT INTO storage.buckets (id, name, public) VALUES 
('originals', 'originals', false),
('thumbnails', 'thumbnails', false);
```

### 2. 缩略图生成系统

#### Edge Function 实现
`supabase/functions/generate-thumbnail/index.ts` 负责：
- 接收原图路径和用户ID
- 下载原图并生成缩略图（800px 宽度）
- 上传缩略图到专用存储桶
- 返回原图和缩略图的签名URL

#### 上传流程优化
```javascript
// 新的上传流程
export async function safeUpload(file: File) {
  // 1. 上传原图到 originals/ 目录
  const originalPath = `${userId}/originals/${fileName}`;
  
  // 2. 调用 Edge Function 生成缩略图
  const { data } = await supabase.functions.invoke('generate-thumbnail', {
    body: { originalPath, userId }
  });
  
  // 3. 返回原图和缩略图的签名URL
  return {
    originalUrl: data.originalUrl,
    thumbnailUrl: data.thumbnailUrl,
    originalPath
  };
}
```

### 3. 签名URL管理

#### 生成策略
- 缩略图：1小时有效期，用于列表显示
- 原图：1小时有效期，用于全屏查看
- 避免重复生成，减少API调用

#### 使用场景
```javascript
// 列表页：仅加载缩略图
const photos = await supabase
  .from('photos')
  .select('id, title, image_urls'); // image_urls 存储缩略图URL

// 详情页：按需加载原图  
const loadOriginalImage = async (photoId) => {
  const { data } = await supabase.storage
    .from('originals')
    .createSignedUrl(originalPath, 3600);
  return data.signedUrl;
};
```

### 4. 懒加载优化

#### 图片组件改进
`AdaptiveImage` 组件优化：
- 默认显示缩略图
- 滚动到视窗时才加载
- 点击时加载高清原图

```javascript
// 移动端黑框修复
const containerStyle = {
  aspectRatio: `${calculatedAspectRatio}`,
  background: 'transparent' // 确保背景透明
};

// 图片样式优化
className="w-full h-auto object-contain bg-transparent"
```

## 成本节约分析

### 流量减少预期
1. **缩略图使用**: 列表页流量减少 70-80%
2. **私有存储**: 避免直接访问，减少无效流量
3. **懒加载**: 减少预加载的图片数量
4. **签名URL缓存**: 减少重复生成的API调用

### 存储结构
```
supabase/storage/
├── originals/          # 原图存储（私有）
│   └── {userId}/
│       └── originals/
│           └── image.jpg
├── thumbnails/         # 缩略图存储（私有）  
│   └── {userId}/
│       └── thumbnails/
│           └── image.jpg
└── photos/            # 兼容性保留（私有）
```

## 使用说明

### 开发者指南

#### 1. 上传图片
```javascript
import { safeUploadMultiple } from '@/lib/upload';

const handleUpload = async (files) => {
  const { thumbnailUrls, originalUrls } = await safeUploadMultiple(files);
  
  // 存储缩略图URL用于显示
  await supabase.from('photos').insert({
    image_url: thumbnailUrls[0],
    image_urls: thumbnailUrls
  });
};
```

#### 2. 显示图片
```javascript
// 列表页：使用缩略图
<AdaptiveImage 
  src={photo.image_url} // 缩略图URL
  isThumbnail={true}
/>

// 详情页：按需加载原图
const [originalUrl, setOriginalUrl] = useState(null);

const loadOriginal = async () => {
  const url = await loadOriginalImage(photo.id);
  setOriginalUrl(url);
};
```

#### 3. 权限管理
所有存储桶都配置了严格的RLS策略：
```sql
-- 用户只能访问自己的文件
CREATE POLICY "Users can view their own content in private buckets" 
ON storage.objects FOR SELECT USING (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 监控和维护

#### 1. 流量监控
定期检查 Supabase Dashboard 中的：
- Cached Egress 使用量
- Storage API 调用次数
- Edge Function 执行统计

#### 2. 优化建议
- 定期清理过期的签名URL缓存
- 监控缩略图生成失败率
- 根据使用情况调整签名URL过期时间

#### 3. 故障处理
```javascript
// 缩略图生成失败时的降级策略
if (thumbnailError) {
  console.error('Thumbnail generation failed:', thumbnailError);
  // 使用原图的签名URL作为后备
  const fallbackUrl = await createSignedUrl(originalPath);
  return { thumbnailUrl: fallbackUrl, originalUrl: fallbackUrl };
}
```

## 预期效果

### 成本降低
- **Cached Egress**: 预计减少 60-80%
- **Storage API 调用**: 减少 40-50%
- **整体成本**: 在免费额度内运行

### 用户体验
- **加载速度**: 列表页加载速度提升 3-5 倍
- **流量消耗**: 移动端用户流量消耗减少 70%
- **响应性**: 懒加载提升页面响应性

### 系统稳定性
- **降级机制**: 缩略图生成失败时自动使用原图
- **缓存策略**: 减少重复请求，提升稳定性
- **错误处理**: 完整的错误处理和日志记录

## 回滚方案

如需回滚到原方案：
```sql
-- 1. 恢复公开存储桶
UPDATE storage.buckets SET public = true WHERE id = 'photos';

-- 2. 更新应用代码使用公开URL
const { data } = supabase.storage.from('photos').getPublicUrl(path);

-- 3. 停用 Edge Function
-- 在 supabase/config.toml 中注释掉 thumbnail 函数配置
```

注意：回滚前请确保数据完整性，建议先在测试环境验证。