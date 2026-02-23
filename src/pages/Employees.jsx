import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    hire_date: '',
    unit_id: null,
  });

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiClient.listEmployees(),
  });

  // Fetch versions to get units
  const { data: versions = [] } = useQuery({
    queryKey: ['versions'],
    queryFn: () => apiClient.listVersions(),
  });

  // Fetch units for selected version
  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedVersion],
    queryFn: () => selectedVersion ? apiClient.listUnits(selectedVersion) : Promise.resolve([]),
    enabled: !!selectedVersion,
  });

  // Filter units to show only those with STAS code (exclude legends and special units)
  const regularUnits = units.filter(unit => 
    unit.stas_code && 
    unit.unit_type !== 'legend' && 
    unit.unit_type !== 'consiliu'
  );

  // Set default version when versions load
  React.useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0].id);
    }
  }, [versions, selectedVersion]);

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setShowDialog(false);
      resetForm();
      toast.success('Angajat adăugat cu succes');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setShowDialog(false);
      resetForm();
      toast.success('Angajat actualizat');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      toast.success('Angajat șters');
    },
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      hire_date: '',
      unit_id: null,
    });
    setEditingEmployee(null);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      hire_date: employee.hire_date || '',
      unit_id: employee.unit_id || null,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-7 h-7 text-blue-600" />
              Angajați
            </h1>
            <p className="text-gray-500">Gestionare personal</p>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Angajat Nou
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Căutare după nume sau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="outline">
                {filteredEmployees.length} angajați
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Data Angajării</TableHead>
                  <TableHead>Unitate</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      {emp.first_name} {emp.last_name}
                    </TableCell>
                    <TableCell>{emp.email || '—'}</TableCell>
                    <TableCell>{emp.phone || '—'}</TableCell>
                    <TableCell>
                      {emp.hire_date ? format(new Date(emp.hire_date), 'dd.MM.yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      {emp.unit_id ? (
                        <Badge variant="outline">
                          {(() => {
                            const unit = units.find(u => u.id === emp.unit_id);
                            if (!unit) return `Unitate #${emp.unit_id}`;
                            return unit.stas_code ? `${unit.stas_code} - ${unit.name}` : unit.name;
                          })()}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteMutation.mutate(emp.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nu există angajați
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Editare Angajat' : 'Angajat Nou'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prenume *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Nume *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Angajării</Label>
                <Input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Unitate</Label>
                <Select
                  value={formData.unit_id?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, unit_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează unitatea" />
                  </SelectTrigger>
                  <SelectContent>
                    {regularUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.stas_code} - {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Anulare
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.first_name || !formData.last_name}
            >
              {editingEmployee ? 'Salvează' : 'Adaugă'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}