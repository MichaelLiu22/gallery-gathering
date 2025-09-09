import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { 
  useNotifications, 
  useUnreadNotificationsCount, 
  useMarkNotificationsAsRead,
  useNotificationRealtime 
} from '@/hooks/useNotifications';

interface NotificationBadgeProps {
  onFriendRequestClick?: () => void;
}

export default function NotificationBadge({ onFriendRequestClick }: NotificationBadgeProps) {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { mutate: markAsRead } = useMarkNotificationsAsRead();
  
  // Enable real-time updates
  useNotificationRealtime();
  
  const handleMarkAllAsRead = () => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Mark this notification as read
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'comment':
      case 'friend_post':
      case 'like':
        if (notification.related_id) {
          navigate(`/photo/${notification.related_id}`);
        }
        break;
      case 'friend_request':
        if (onFriendRequestClick) {
          onFriendRequestClick();
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return '💬';
      case 'friend_post':
        return '📸';
      case 'friend_request':
        return '👋';
      case 'like':
        return '❤️';
      default:
        return '🔔';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">通知</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="text-xs h-auto p-1"
              >
                全部已读
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              暂无通知
            </div>
          ) : (
            <div className="p-0">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: zhCN
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}