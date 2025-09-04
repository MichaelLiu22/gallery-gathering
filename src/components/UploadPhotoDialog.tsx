import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import exifr from 'exifr';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUploadPhoto } from '@/hooks/useUploadPhoto';
import { Upload, X, Camera } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(1, '请输入作品标题'),
  description: z.string().optional(),
  camera_equipment: z.string().optional(),
});

interface UploadPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadPhotoDialog({ open, onOpenChange }: UploadPhotoDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [exposureData, setExposureData] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const uploadMutation = useUploadPhoto();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      camera_equipment: '',
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Extract EXIF data
    setIsExtracting(true);
    try {
      const exifData = await exifr.parse(file);
      if (exifData) {
        setExposureData({
          iso: exifData.ISO,
          aperture: exifData.FNumber ? `f/${exifData.FNumber}` : undefined,
          shutter_speed: exifData.ExposureTime ? `1/${Math.round(1/exifData.ExposureTime)}` : undefined,
          focal_length: exifData.FocalLength ? `${exifData.FocalLength}mm` : undefined,
        });
        
        // Auto-fill camera equipment if available
        if (exifData.Make && exifData.Model) {
          form.setValue('camera_equipment', `${exifData.Make} ${exifData.Model}`);
        }
      }
    } catch (error) {
      console.log('No EXIF data found');
    } finally {
      setIsExtracting(false);
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedFile) {
      toast.error('请选择图片文件');
      return;
    }

    await uploadMutation.mutateAsync({
      title: values.title,
      description: values.description,
      camera_equipment: values.camera_equipment,
      file: selectedFile,
      exposure_settings: exposureData,
    });

    // Reset form and close dialog
    form.reset();
    setSelectedFile(null);
    setPreview(null);
    setExposureData(null);
    onOpenChange(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setExposureData(null);
    form.setValue('camera_equipment', '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            上传作品
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? '放开文件即可上传' : '点击或拖拽图片到此处'}
              </p>
              <p className="text-sm text-muted-foreground">
                支持 JPEG、PNG、WebP 格式，最大 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview!}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isExtracting && (
                <p className="text-sm text-muted-foreground">正在读取照片信息...</p>
              )}

              {exposureData && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">拍摄参数</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {exposureData.iso && <span>ISO: {exposureData.iso}</span>}
                    {exposureData.aperture && <span>光圈: {exposureData.aperture}</span>}
                    {exposureData.shutter_speed && <span>快门: {exposureData.shutter_speed}s</span>}
                    {exposureData.focal_length && <span>焦距: {exposureData.focal_length}</span>}
                  </div>
                </div>
              )}

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

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                      disabled={uploadMutation.isPending}
                    >
                      取消
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={uploadMutation.isPending}
                      className="min-w-[100px]"
                    >
                      {uploadMutation.isPending ? '上传中...' : '发布作品'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}