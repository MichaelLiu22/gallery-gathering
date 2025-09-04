import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SortOrder, PhotoFilter } from "@/hooks/usePhotos";
import { useAuth } from "@/hooks/useAuth";

interface SortFilterProps {
  sortOrder: SortOrder;
  filter: PhotoFilter;
  onSortChange: (sort: SortOrder) => void;
  onFilterChange: (filter: PhotoFilter) => void;
}

const SortFilter = ({ sortOrder, filter, onSortChange, onFilterChange }: SortFilterProps) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">排序:</span>
        <Select value={sortOrder} onValueChange={onSortChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">最新发布</SelectItem>
            <SelectItem value="likes">最多点赞</SelectItem>
            <SelectItem value="comments">最多评论</SelectItem>
            <SelectItem value="hot">火热度</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">筛选:</span>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
          >
            全部
          </Button>
          {user && (
            <>
              <Button
                variant={filter === 'friends' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('friends')}
              >
                朋友作品
              </Button>
              <Button
                variant={filter === 'mine' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('mine')}
              >
                我的作品
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SortFilter;