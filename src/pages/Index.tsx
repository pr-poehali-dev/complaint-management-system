import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type ComplaintStatus = 'pending' | 'review' | 'resolved';
type ComplaintType = 'against_guard' | 'from_guard';

interface Complaint {
  id: number;
  title: string;
  description: string;
  type: ComplaintType;
  status: ComplaintStatus;
  date: string;
  response?: string | null;
  photo?: string;
}

const API_URL = 'https://functions.poehali.dev/5a02d605-e811-4d39-a68f-944fb55cd466';

const Index = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    type: 'against_guard' as ComplaintType,
    photo: '',
  });

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [response, setResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ComplaintType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      setComplaints(data);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить жалобы',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Ошибка',
          description: 'Размер файла не должен превышать 5 МБ',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewComplaint({ ...newComplaint, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.title || !newComplaint.description) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComplaint),
      });
      
      if (!response.ok) throw new Error('Failed to create complaint');
      
      await fetchComplaints();
      setNewComplaint({ title: '', description: '', type: 'against_guard', photo: '' });
      toast({
        title: 'Жалоба отправлена',
        description: 'Ваша жалоба принята на рассмотрение',
      });
    } catch (error) {
      console.error('Ошибка отправки:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить жалобу',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (complaintId: number, newStatus: ComplaintStatus) => {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: complaintId, status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      await fetchComplaints();
      toast({
        title: 'Статус обновлен',
        description: `Статус жалобы изменен на "${getStatusLabel(newStatus)}"`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive',
      });
    }
  };

  const handleResponseSubmit = async (complaintId: number) => {
    if (!response.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ответ',
        variant: 'destructive',
      });
      return;
    }

    try {
      const apiResponse = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: complaintId, response, status: 'resolved' }),
      });
      
      if (!apiResponse.ok) throw new Error('Failed to submit response');
      
      await fetchComplaints();
      setResponse('');
      setSelectedComplaint(null);
      toast({
        title: 'Ответ отправлен',
        description: 'Жалоба закрыта с ответом',
      });
    } catch (error) {
      console.error('Failed to submit response:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить ответ',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    const variants = {
      pending: { label: 'Ожидает', className: 'bg-blue-100 text-blue-800' },
      review: { label: 'Требует разбора', className: 'bg-amber-100 text-amber-800' },
      resolved: { label: 'Решено', className: 'bg-green-100 text-green-800' },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getStatusLabel = (status: ComplaintStatus) => {
    const labels = {
      pending: 'Ожидает',
      review: 'Требует разбора',
      resolved: 'Решено',
    };
    return labels[status];
  };

  const getTypeLabel = (type: ComplaintType) => {
    return type === 'against_guard' ? 'На дежурного' : 'От дежурного';
  };

  const getFilteredComplaints = () => {
    return complaints.filter(complaint => {
      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
      const matchesType = typeFilter === 'all' || complaint.type === typeFilter;
      const matchesSearch = searchQuery === '' || 
        complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesType && matchesSearch;
    });
  };

  const filteredComplaints = getFilteredComplaints();

  const getStats = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const review = complaints.filter(c => c.status === 'review').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const againstGuard = complaints.filter(c => c.type === 'against_guard').length;
    const fromGuard = complaints.filter(c => c.type === 'from_guard').length;
    
    return { total, pending, review, resolved, againstGuard, fromGuard };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Платформа жалоб</h1>
          <p className="text-gray-600">Управление жалобами на дежурных и от дежурных</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего жалоб</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon name="FileText" size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ожидает</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon name="Clock" size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">На разборе</p>
                <p className="text-3xl font-bold text-amber-600">{stats.review}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Icon name="AlertTriangle" size={24} className="text-amber-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Решено</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Icon name="CheckCircle" size={24} className="text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">На дежурных</p>
                <p className="text-3xl font-bold text-red-600">{stats.againstGuard}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Icon name="AlertCircle" size={24} className="text-red-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">От дежурных</p>
                <p className="text-3xl font-bold text-primary">{stats.fromGuard}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon name="ShieldAlert" size={24} className="text-primary" />
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Icon name="FileText" size={18} />
              Подать жалобу
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Icon name="List" size={18} />
              Все жалобы
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Icon name="Shield" size={18} />
              Админ-панель
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="animate-fade-in">
            <Card className="p-6 shadow-lg">
              <form onSubmit={handleSubmitComplaint} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon name="ClipboardList" size={24} className="text-primary" />
                    Форма подачи жалобы
                  </h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Тип жалобы</Label>
                  <Select
                    value={newComplaint.type}
                    onValueChange={(value) => setNewComplaint({ ...newComplaint, type: value as ComplaintType })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="against_guard">
                        <div className="flex items-center gap-2">
                          <Icon name="AlertCircle" size={16} className="text-destructive" />
                          На дежурного
                        </div>
                      </SelectItem>
                      <SelectItem value="from_guard">
                        <div className="flex items-center gap-2">
                          <Icon name="AlertCircle" size={16} className="text-primary" />
                          От дежурного
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок инцидента</Label>
                  <Input
                    id="title"
                    placeholder="Краткое описание проблемы"
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Подробное описание</Label>
                  <Textarea
                    id="description"
                    placeholder="Опишите ситуацию детально: что произошло, когда, кто был свидетелем..."
                    rows={6}
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Фото (необязательно)</Label>
                  <div className="space-y-3">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    {newComplaint.photo && (
                      <div className="relative inline-block">
                        <img
                          src={newComplaint.photo}
                          alt="Прикрепленное фото"
                          className="max-w-xs rounded-lg border shadow-sm"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setNewComplaint({ ...newComplaint, photo: '' })}
                        >
                          <Icon name="X" size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Максимальный размер: 5 МБ</p>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  <Icon name="Send" size={18} className="mr-2" />
                  Отправить жалобу
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="animate-fade-in">
            <Card className="p-4 mb-6 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Поиск</Label>
                  <div className="relative">
                    <Icon name="Search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Поиск по заголовку или описанию..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComplaintStatus | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="pending">Ожидает</SelectItem>
                      <SelectItem value="review">Требует разбора</SelectItem>
                      <SelectItem value="resolved">Решено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Тип жалобы</Label>
                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ComplaintType | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="against_guard">На дежурного</SelectItem>
                      <SelectItem value="from_guard">От дежурного</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
            <div className="space-y-4">
              {loading ? (
                <Card className="p-12 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-gray-600">Загрузка жалоб...</p>
                  </div>
                </Card>
              ) : filteredComplaints.length === 0 ? (
                <Card className="p-12 text-center">
                  <Icon name="Inbox" size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {complaints.length === 0 ? 'Жалоб пока нет' : 'Жалобы не найдены по выбранным фильтрам'}
                  </p>
                </Card>
              ) : (
                filteredComplaints.map((complaint) => (
                  <Card key={complaint.id} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{complaint.title}</h3>
                          {getStatusBadge(complaint.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={14} />
                            {complaint.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Tag" size={14} />
                            {getTypeLabel(complaint.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{complaint.description}</p>
                    {complaint.photo && (
                      <div className="mb-4">
                        <img
                          src={complaint.photo}
                          alt="Приложенное фото"
                          className="max-w-sm rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(complaint.photo, '_blank')}
                        />
                      </div>
                    )}
                    {complaint.response && (
                      <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="MessageSquare" size={16} className="text-green-700" />
                          <span className="font-semibold text-green-900">Ответ администрации:</span>
                        </div>
                        <p className="text-green-800">{complaint.response}</p>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon name="ListFilter" size={24} className="text-primary" />
                    Список жалоб
                  </h2>
                  <div className="space-y-3 mb-4">
                    <div className="relative">
                      <Icon name="Search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComplaintStatus | 'all')}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все статусы</SelectItem>
                          <SelectItem value="pending">Ожидает</SelectItem>
                          <SelectItem value="review">Требует разбора</SelectItem>
                          <SelectItem value="resolved">Решено</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ComplaintType | 'all')}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все типы</SelectItem>
                          <SelectItem value="against_guard">На дежурного</SelectItem>
                          <SelectItem value="from_guard">От дежурного</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredComplaints.length === 0 ? (
                    <Card className="p-6 text-center">
                      <Icon name="Inbox" size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Не найдено</p>
                    </Card>
                  ) : (
                    filteredComplaints.map((complaint) => (
                    <Card
                      key={complaint.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedComplaint?.id === complaint.id
                          ? 'ring-2 ring-primary shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{complaint.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{complaint.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(complaint.status)}
                            <span className="text-xs text-gray-500">{complaint.date}</span>
                          </div>
                        </div>
                        <Icon name="ChevronRight" size={20} className="text-gray-400" />
                      </div>
                    </Card>
                  ))
                  )}
                </div>
              </div>

              <div>
                {selectedComplaint ? (
                  <Card className="p-6 shadow-lg sticky top-4">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Icon name="Eye" size={24} className="text-primary" />
                      Детали жалобы
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-600">Заголовок</Label>
                        <p className="text-lg font-semibold">{selectedComplaint.title}</p>
                      </div>

                      <div>
                        <Label className="text-gray-600">Описание</Label>
                        <p className="text-gray-800">{selectedComplaint.description}</p>
                      </div>

                      {selectedComplaint.photo && (
                        <div>
                          <Label className="text-gray-600 mb-2 block">Приложенное фото</Label>
                          <img
                            src={selectedComplaint.photo}
                            alt="Приложенное фото"
                            className="max-w-full rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.open(selectedComplaint.photo, '_blank')}
                          />
                        </div>
                      )}

                      <div className="flex gap-4">
                        <div>
                          <Label className="text-gray-600">Тип</Label>
                          <p>{getTypeLabel(selectedComplaint.type)}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Дата</Label>
                          <p>{selectedComplaint.date}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-600 mb-2 block">Изменить статус</Label>
                        <Select
                          value={selectedComplaint.status}
                          onValueChange={(value) => handleStatusChange(selectedComplaint.id, value as ComplaintStatus)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Ожидает
                              </div>
                            </SelectItem>
                            <SelectItem value="review">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                Требует разбора
                              </div>
                            </SelectItem>
                            <SelectItem value="resolved">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Решено
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedComplaint.response ? (
                        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                          <Label className="text-green-900 mb-2 block">Ваш ответ</Label>
                          <p className="text-green-800">{selectedComplaint.response}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Label htmlFor="response">Ответ на жалобу</Label>
                          <Textarea
                            id="response"
                            placeholder="Введите ответ или заключение по результатам разбора..."
                            rows={5}
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                          />
                          <Button
                            onClick={() => handleResponseSubmit(selectedComplaint.id)}
                            className="w-full"
                          >
                            <Icon name="CheckCircle" size={18} className="mr-2" />
                            Отправить ответ и закрыть жалобу
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="p-12 text-center shadow-lg">
                    <Icon name="MousePointerClick" size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Выберите жалобу для просмотра</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;