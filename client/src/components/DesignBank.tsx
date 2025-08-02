
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Upload, 
  Download, 
  Heart, 
  Share2, 
  Eye,
  Image as ImageIcon,
  FileImage,
  Video,
  FileText,
  Tag,
  Calendar
} from 'lucide-react';

interface DesignAsset {
  id: number;
  name: string;
  type: 'image' | 'video' | 'document';
  category: string;
  tags: string[];
  url: string;
  thumbnail: string;
  size: string;
  uploadedBy: string;
  uploadedAt: Date;
  downloads: number;
  favorites: number;
  description?: string;
}

export function DesignBank() {
  const [assets] = useState<DesignAsset[]>([
    {
      id: 1,
      name: 'Classic Solitaire Ring Collection',
      type: 'image',
      category: 'Rings',
      tags: ['solitaire', 'engagement', 'classic', 'diamond'],
      url: '#',
      thumbnail: '/api/placeholder/300/200',
      size: '2.4 MB',
      uploadedBy: 'Design Team',
      uploadedAt: new Date('2024-01-15'),
      downloads: 45,
      favorites: 23,
      description: 'Elegant solitaire engagement rings with various diamond cuts'
    },
    {
      id: 2,
      name: 'Wedding Necklace Sets',
      type: 'image',
      category: 'Necklaces',
      tags: ['wedding', 'bridal', 'traditional', 'gold'],
      url: '#',
      thumbnail: '/api/placeholder/300/200',
      size: '3.1 MB',
      uploadedBy: 'Marketing Team',
      uploadedAt: new Date('2024-01-18'),
      downloads: 67,
      favorites: 34,
      description: 'Traditional gold necklace sets perfect for weddings'
    },
    {
      id: 3,
      name: 'Diamond Earring Catalog',
      type: 'document',
      category: 'Earrings',
      tags: ['earrings', 'diamond', 'catalog', 'studs'],
      url: '#',
      thumbnail: '/api/placeholder/300/200',
      size: '5.2 MB',
      uploadedBy: 'Product Team',
      uploadedAt: new Date('2024-01-20'),
      downloads: 89,
      favorites: 56,
      description: 'Complete catalog of diamond earring designs with specifications'
    },
    {
      id: 4,
      name: 'Jewelry Care Guide Video',
      type: 'video',
      category: 'Education',
      tags: ['care', 'maintenance', 'guide', 'tutorial'],
      url: '#',
      thumbnail: '/api/placeholder/300/200',
      size: '12.8 MB',
      uploadedBy: 'Customer Service',
      uploadedAt: new Date('2024-01-22'),
      downloads: 123,
      favorites: 78,
      description: 'Step-by-step guide on how to care for diamond jewelry'
    },
    {
      id: 5,
      name: 'Anniversary Collection 2024',
      type: 'image',
      category: 'Collections',
      tags: ['anniversary', '2024', 'collection', 'romantic'],
      url: '#',
      thumbnail: '/api/placeholder/300/200',
      size: '4.7 MB',
      uploadedBy: 'Design Team',
      uploadedAt: new Date('2024-01-25'),
      downloads: 34,
      favorites: 19,
      description: 'Romantic jewelry pieces perfect for anniversary celebrations'
    },
    {
      id: 6,
      name: 'Custom Design Templates',
      type: 'document',
      category: 'Templates',
      tags: ['custom', 'template', 'design', 'specification'],
      url: '#',
      thumbnail: '/api/placeholder/300/200',
      size: '1.8 MB',
      uploadedBy: 'Design Team',
      uploadedAt: new Date('2024-01-28'),
      downloads: 12,
      favorites: 8,
      description: 'Templates for creating custom jewelry designs'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const categories = ['All', 'Rings', 'Necklaces', 'Earrings', 'Collections', 'Education', 'Templates'];
  const types = ['All', 'Image', 'Video', 'Document'];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <FileImage className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssets = assets.filter((asset: DesignAsset) => {
    const matchesSearch = !searchTerm || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || 
      asset.category.toLowerCase() === categoryFilter.toLowerCase();
    
    const matchesType = typeFilter === 'all' || 
      asset.type.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const formatFileSize = (size: string) => size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🎨 Design Bank</h2>
          <p className="text-gray-600 mt-1">Repository of designs, catalogs, and marketing materials</p>
        </div>
        
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
              </div>
              <FileImage className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Images</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assets.filter(a => a.type === 'image').length}
                </p>
              </div>
              <ImageIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Videos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assets.filter(a => a.type === 'video').length}
                </p>
              </div>
              <Video className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assets.filter(a => a.type === 'document').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assets by name or tags..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-3 lg:grid-cols-7">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category.toLowerCase()} 
                    value={category.toLowerCase()}
                    className="text-xs"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4">
                {types.map((type) => (
                  <TabsTrigger 
                    key={type.toLowerCase()} 
                    value={type.toLowerCase()}
                    className="text-xs"
                  >
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search term.'
                : 'Upload your first asset to get started.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset: DesignAsset) => (
            <Card key={asset.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
              <div className="relative">
                {/* Placeholder for asset thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <div className="text-center">
                    {getTypeIcon(asset.type)}
                    <p className="text-xs text-gray-600 mt-2">{asset.type.toUpperCase()}</p>
                  </div>
                </div>
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {asset.name}
                    </h3>
                    <Badge className={getTypeColor(asset.type)}>
                      {getTypeIcon(asset.type)}
                      <span className="ml-1">{asset.type}</span>
                    </Badge>
                  </div>

                  {asset.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {asset.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{asset.category}</span>
                    <span>{formatFileSize(asset.size)}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {asset.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {asset.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{asset.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Download className="h-3 w-3" />
                        <span>{asset.downloads}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{asset.favorites}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Heart className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>By {asset.uploadedBy}</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{asset.uploadedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Upload className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Custom Design Templates uploaded</p>
                  <p className="text-xs text-gray-500">2 hours ago by Design Team</p>
                </div>
              </div>
              <Badge variant="outline">New</Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Wedding Necklace Sets downloaded 15 times</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <Badge variant="secondary">Popular</Badge>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Diamond Earring Catalog favorited by 12 users</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
              <Badge variant="outline">Trending</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
