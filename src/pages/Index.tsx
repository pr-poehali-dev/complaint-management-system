import { useState } from 'react';
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
  id: string;
  title: string;
  description: string;
  type: ComplaintType;
  status: ComplaintStatus;
  date: string;
  response?: string;
}

const Index = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: '1',
      title: 'Грубое обращение с посетителями',
      description: 'Дежурный Иванов И.И. нагрубил посетителю в фойе здания без видимой причины.',
      type: 'against_guard',
      status: 'review',
      date: '2025-10-08',
    },
    {
      id: '2',
      title: 'Нарушение пропускного режима',
      description: 'Сотрудник Петров пытался провести постороннее лицо без оформления пропуска.',
      type: 'from_guard',
      status: 'pending',
      date: '2025-10-09',
    },
  ]);

  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    type: 'against_guard' as ComplaintType,
  });

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [response, setResponse] = useState('');

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.title || !newComplaint.description) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    const complaint: Complaint = {
      id: Date.now().toString(),
      ...newComplaint,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };

    setComplaints([complaint, ...complaints]);
    setNewComplaint({ title: '', description: '', type: 'against_guard' });
    toast({
      title: 'Жалоба отправлена',
      description: 'Ваша жалоба принята на рассмотрение',
    });
  };

  const handleStatusChange = (complaintId: string, newStatus: ComplaintStatus) => {
    setComplaints(complaints.map(c => 
      c.id === complaintId ? { ...c, status: newStatus } : c
    ));
    toast({
      title: 'Статус обновлен',
      description: `Статус жалобы изменен на "${getStatusLabel(newStatus)}"`,
    });
  };

  const handleResponseSubmit = (complaintId: string) => {
    if (!response.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ответ',
        variant: 'destructive',
      });
      return;
    }

    setComplaints(complaints.map(c => 
      c.id === complaintId ? { ...c, response, status: 'resolved' } : c
    ));
    setResponse('');
    setSelectedComplaint(null);
    toast({
      title: 'Ответ отправлен',
      description: 'Жалоба закрыта с ответом',
    });
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

  const filterComplaints = (filter: string) => {
    if (filter === 'all') return complaints;
    return complaints.filter(c => c.status === filter);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Платформа жалоб</h1>
          <p className="text-gray-600">Управление жалобами на дежурных и от дежурных</p>
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

                <Button type="submit" size="lg" className="w-full">
                  <Icon name="Send" size={18} className="mr-2" />
                  Отправить жалобу
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="animate-fade-in">
            <div className="space-y-4">
              {complaints.length === 0 ? (
                <Card className="p-12 text-center">
                  <Icon name="Inbox" size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Жалоб пока нет</p>
                </Card>
              ) : (
                complaints.map((complaint) => (
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
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon name="ListFilter" size={24} className="text-primary" />
                  Список жалоб
                </h2>
                <div className="space-y-3">
                  {complaints.map((complaint) => (
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
                  ))}
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
