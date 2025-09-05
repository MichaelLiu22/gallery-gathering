import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRatings, RatingInput } from '@/hooks/useRatings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, Trash2 } from 'lucide-react';

interface PhotoRatingProps {
  photoId: number;
}

export default function PhotoRating({ photoId }: PhotoRatingProps) {
  const { user } = useAuth();
  const { ratings, userRating, stats, submitRating, deleteRating, isSubmitting, isDeleting } = useRatings(photoId);
  
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingInput, setRatingInput] = useState<RatingInput>({
    composition_score: userRating?.composition_score || 5,
    storytelling_score: userRating?.storytelling_score || 5,
    technique_score: userRating?.technique_score || 5,
  });

  const handleSubmitRating = () => {
    submitRating(ratingInput);
    setShowRatingForm(false);
  };

  const handleDeleteRating = () => {
    deleteRating();
  };

  const categories = [
    { key: 'composition_score', label: '构图', value: ratingInput.composition_score },
    { key: 'storytelling_score', label: '故事感', value: ratingInput.storytelling_score },
    { key: 'technique_score', label: '拍摄技术', value: ratingInput.technique_score }
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-primary" />
            <span>作品评分</span>
          </div>
          {stats.totalRatings > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {stats.overallAverage.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.totalRatings} 人评分
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Stats */}
        {stats.totalRatings > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>构图</span>
              <span className="font-medium">{stats.averageComposition.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>故事感</span>
              <span className="font-medium">{stats.averageStorytelling.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>拍摄技术</span>
              <span className="font-medium">{stats.averageTechnique.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* User Rating Section */}
        {user && (
          <>
            <Separator />
            {userRating ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">我的评分</h4>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRatingInput({
                          composition_score: userRating.composition_score,
                          storytelling_score: userRating.storytelling_score,
                          technique_score: userRating.technique_score,
                        });
                        setShowRatingForm(true);
                      }}
                    >
                      修改
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteRating}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {userRating.average_score.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    构图 {userRating.composition_score} · 故事感 {userRating.storytelling_score} · 技术 {userRating.technique_score}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">您还没有给这个作品评分</p>
                <Button onClick={() => setShowRatingForm(true)} className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  给作品评分
                </Button>
              </div>
            )}
          </>
        )}

        {/* Rating Form */}
        {showRatingForm && user && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">
                {userRating ? '修改评分' : '给作品评分'}
              </h4>
              
              {categories.map(({ key, label, value }) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-primary">{value.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={(values) => 
                      setRatingInput(prev => ({ ...prev, [key]: values[0] }))
                    }
                    max={10}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              ))}
              
              <div className="text-center">
                <div className="text-lg font-semibold text-primary">
                  总分: {((ratingInput.composition_score + ratingInput.storytelling_score + ratingInput.technique_score) / 3).toFixed(1)}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleSubmitRating}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? '提交中...' : '提交评分'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRatingForm(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Other Ratings */}
        {ratings.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">所有评分</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {ratings.map((rating) => (
                  <div key={rating.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={rating.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {rating.profiles?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">
                        {rating.profiles?.display_name || '匿名用户'}
                      </span>
                    </div>
                    <div className="font-medium text-primary">
                      {rating.average_score.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
