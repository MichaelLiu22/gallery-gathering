import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import exifr from 'exifr';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUploadPhoto } from '@/hooks/useUploadPhoto';
import { Upload, X, Plus, Camera } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(1, '请输入作品标题'),
  description: z.string().optional(),
  camera_equipment: z.string().optional(),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
});

interface UploadPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadPhotoDialog({ open, onOpenChange }: UploadPhotoDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [exposureData, setExposureData] = useState<any>({});

  const { mutate: uploadPhoto, isPending: isUploading } = useUploadPhoto();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      camera_equipment: '',
      visibility: 'public' as const,
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, 9 - selectedFiles.length); // Limit to 9 total images
    
    if (newFiles.length === 0) return;

    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);

    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);

    // Extract EXIF data from first image if this is the first upload
    if (selectedFiles.length === 0 && newFiles[0]) {
      const firstFile = newFiles[0];
      exifr.parse(firstFile).then((exifData: any) => {
        if (exifData) {
          const make = exifData.Make || '';
          const model = exifData.Model || '';
          const camera = `${make} ${model}`.trim();
          
          if (camera) {
            form.setValue('camera_equipment', camera);
          }

          setExposureData({
            iso: exifData.ISO,
            aperture: exifData.FNumber ? `f/${exifData.FNumber}` : undefined,
            shutter_speed: exifData.ExposureTime ? `1/${Math.round(1 / exifData.ExposureTime)}` : undefined,
            focal_length: exifData.FocalLength ? `${exifData.FocalLength}mm` : undefined,
          });
        }
      }).catch(console.error);
    }
  }, [form, selectedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB per file
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedFiles.length === 0) {
      toast.error('请先选择图片');
      return;
    }

    uploadPhoto({
      title: values.title,
      description: values.description,
      camera_equipment: values.camera_equipment,
      visibility: values.visibility,
      files: selectedFiles,
      exposure_settings: exposureData,
    }, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke the URL for the removed preview
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    
    // Clear EXIF data if removing the first image
    if (index === 0) {
      setExposureData({});
      form.setValue('camera_equipment', '');
    }
  };
  
  const removeAllFiles = () => {
    previews.forEach(preview => URL.revokeObjectURL(preview));
    setSelectedFiles([]);
    setPreviews([]);
    setExposureData({});
    form.setValue('camera_equipment', '');
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    removeAllFiles();
  };

  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>发布作品</DialogTitle>
        </DialogHeader>

        {selectedFiles.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? '放开文件即可上传' : '点击或拖拽图片到此处'}
            </p>
            <p className="text-center text-muted-foreground">
              拖拽图片到此处，或点击选择文件
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              支持 JPEG、PNG、WebP 格式，单个文件最大 10MB，最多9张图片
            </p>
          </div>
        ) : (
          <>
            {/* Image Previews */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedFiles.length} 张图片 (最多9张)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeAllFiles}
                >
                  清空所有
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
                
                {/* Add more button */}
                {selectedFiles.length < 9 && (
                  <div
                    {...getRootProps()}
                    className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <input {...getInputProps()} />
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* EXIF data display */}
            {Object.keys(exposureData).length > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  拍摄参数
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {exposureData.iso && <span>ISO: {exposureData.iso}</span>}
                  {exposureData.aperture && <span>光圈: {exposureData.aperture}</span>}
                  {exposureData.shutter_speed && <span>快门: {exposureData.shutter_speed}s</span>}
                  {exposureData.focal_length && <span>焦距: {exposureData.focal_length}</span>}
                </div>
              </div>
            )}

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>作品标题 *</FormLabel>
                      <FormControl>
                        <Input placeholder="为你的作品起个标题..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>作品描述</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="描述一下这张照片的故事..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="camera_equipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>相机设备</FormLabel>
                      <FormControl>
                        <Input placeholder="例如: Canon EOS R5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>可见性</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择可见性" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">公开 - 所有人可见</SelectItem>
                          <SelectItem value="friends">朋友 - 仅朋友可见</SelectItem>
                          <SelectItem value="private">私密 - 仅自己可见</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    取消
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? '发布中...' : '发布作品'}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}