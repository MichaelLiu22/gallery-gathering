import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Heart, Eye, Upload } from 'lucide-react';
import photo1 from '@/assets/photo-1.jpg';
import photo2 from '@/assets/photo-2.jpg';
import photo3 from '@/assets/photo-3.jpg';
import photo4 from '@/assets/photo-4.jpg';

interface Photo {
  id: string;
  title: string;
  description: string;
  image: string;
  photographer: string;
  camera: string;
  lens: string;
  settings: {
    iso: string;
    aperture: string;
    shutter: string;
    focal: string;
  };
  likes: number;
  views: number;
}

const samplePhotos: Photo[] = [
  {
    id: '1',
    title: '黄金时刻的山峦',
    description: '在黄昏时分拍摄的壮丽山景，云层与光线的完美结合创造出了这幅令人屏息的画面。',
    image: photo1,
    photographer: '张摄影师',
    camera: 'Canon EOS R5',
    lens: '24-70mm f/2.8',
    settings: {
      iso: 'ISO 100',
      aperture: 'f/8',
      shutter: '1/125s',
      focal: '35mm'
    },
    likes: 234,
    views: 1250
  },
  {
    id: '2',
    title: '光影人像',
    description: '运用戏剧性光影效果创作的艺术人像作品，展现了光与影的完美平衡。',
    image: photo2,
    photographer: '李艺术家',
    camera: 'Sony A7R IV',
    lens: '85mm f/1.4',
    settings: {
      iso: 'ISO 400',
      aperture: 'f/1.8',
      shutter: '1/200s',
      focal: '85mm'
    },
    likes: 189,
    views: 892
  },
  {
    id: '3',
    title: '夜色都市',
    description: '雨后的城市街道，霓虹灯光在湿润的路面上形成迷人的倒影，营造出浓郁的都市夜晚氛围。',
    image: photo3,
    photographer: '王街拍',
    camera: 'Nikon Z9',
    lens: '14-24mm f/2.8',
    settings: {
      iso: 'ISO 1600',
      aperture: 'f/2.8',
      shutter: '1/60s',
      focal: '20mm'
    },
    likes: 156,
    views: 743
  },
  {
    id: '4',
    title: '微观世界',
    description: '花瓣上的露珠微距摄影，展现了自然界中微小而美丽的细节。',
    image: photo4,
    photographer: '陈微距',
    camera: 'Canon R6 Mark II',
    lens: '100mm f/2.8 Macro',
    settings: {
      iso: 'ISO 200',
      aperture: 'f/5.6',
      shutter: '1/250s',
      focal: '100mm'
    },
    likes: 278,
    views: 1180
  }
];

export default function PhotoGrid() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              摄影作品集
            </h1>
          </div>
          <Button className="bg-gradient-to-r from-primary to-accent text-background hover:opacity-90 transition-all">
            <Upload className="h-4 w-4 mr-2" />
            上传作品
          </Button>
        </div>
      </header>

      {/* Photo Grid */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {samplePhotos.map((photo) => (
            <div
              key={photo.id}
              className="group cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="bg-card rounded-lg overflow-hidden transition-all duration-300 hover:shadow-glow hover:scale-[1.02]">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-semibold text-lg mb-1">{photo.title}</h3>
                      <p className="text-white/80 text-sm">{photo.photographer}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{photo.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{photo.views}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">{photo.camera}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedPhoto.image}
                alt={selectedPhoto.title}
                className="w-full h-64 md:h-96 object-cover rounded-t-xl"
              />
              <Button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              >
                ×
              </Button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2">{selectedPhoto.title}</h2>
                  <p className="text-muted-foreground mb-4">{selectedPhoto.description}</p>
                  <p className="text-sm text-muted-foreground">摄影师：{selectedPhoto.photographer}</p>
                </div>
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>{selectedPhoto.likes} 赞</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>{selectedPhoto.views} 浏览</span>
                  </div>
                </div>
              </div>

              {/* Camera Settings */}
              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-semibold mb-3">拍摄参数</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">相机</p>
                    <p className="font-medium">{selectedPhoto.camera}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">镜头</p>
                    <p className="font-medium">{selectedPhoto.lens}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ISO</p>
                    <p className="font-medium">{selectedPhoto.settings.iso}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">光圈</p>
                    <p className="font-medium">{selectedPhoto.settings.aperture}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">快门</p>
                    <p className="font-medium">{selectedPhoto.settings.shutter}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">焦距</p>
                    <p className="font-medium">{selectedPhoto.settings.focal}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}