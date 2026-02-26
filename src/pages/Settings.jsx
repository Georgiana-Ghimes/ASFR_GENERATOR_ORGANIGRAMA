import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Users, Trash2, Shield, User as UserIcon, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user', full_name: '' });
  const [editUserData, setEditUserData] = useState({ email: '', password: '', role: 'user', full_name: '' });
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.listUsers()
  });

  // Create user
  const createUserMutation = useMutation({
    mutationFn: (userData) => apiClient.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilizatorul a fost creat');
      setIsAddDialogOpen(false);
      setNewUser({ email: '', password: '', role: 'user', full_name: '' });
    },
    onError: (error) => {
      toast.error(error.message || 'Eroare la crearea utilizatorului');
    }
  });

  // Update user
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }) => apiClient.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilizatorul a fost actualizat');
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Eroare la actualizarea utilizatorului');
    }
  });

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => apiClient.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Rolul utilizatorului a fost actualizat');
    },
    onError: () => {
      toast.error('Eroare la actualizarea rolului');
    }
  });

  // Toggle user active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, isActive }) => apiClient.updateUserActive(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Statusul utilizatorului a fost actualizat');
    },
    onError: () => {
      toast.error('Eroare la actualizarea statusului');
    }
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => apiClient.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Utilizatorul a fost șters');
    },
    onError: () => {
      toast.error('Eroare la ștergerea utilizatorului');
    }
  });

  const handleRoleChange = (userId, newRole) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleToggleActive = (userId, currentStatus) => {
    toggleActiveMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleDeleteUser = (userId) => {
    deleteUserMutation.mutate(userId);
  };

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password) {
      toast.error('Email și parola sunt obligatorii');
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserData({ email: user.email, password: '', role: user.role, full_name: user.full_name || '' });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editUserData.email) {
      toast.error('Email-ul este obligatoriu');
      return;
    }
    const updateData = { email: editUserData.email, role: editUserData.role, full_name: editUserData.full_name };
    if (editUserData.password) {
      updateData.password = editUserData.password;
    }
    updateUserMutation.mutate({ userId: editingUser.id, userData: updateData });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Setări</h1>
        <p className="text-gray-500 mt-1">Gestionează setările aplicației</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilizatori
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestionare Utilizatori</CardTitle>
                  <CardDescription>
                    Administrează utilizatorii aplicației, rolurile și permisiunile lor
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adaugă utilizator
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adaugă utilizator nou</DialogTitle>
                      <DialogDescription>
                        Creează un cont nou pentru un utilizator al aplicației
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nume complet</Label>
                        <Input
                          id="full_name"
                          type="text"
                          placeholder="Ion Popescu"
                          value={newUser.full_name}
                          onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="utilizator@exemplu.ro"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Parolă</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-orange-500" />
                                Administrator
                              </div>
                            </SelectItem>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-blue-500" />
                                Utilizator
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Anulează
                      </Button>
                      <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? 'Se creează...' : 'Creează utilizator'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Edit User Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editează utilizator</DialogTitle>
                    <DialogDescription>
                      Modifică datele utilizatorului {editingUser?.email}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-full_name">Nume complet</Label>
                      <Input
                        id="edit-full_name"
                        type="text"
                        placeholder="Ion Popescu"
                        value={editUserData.full_name}
                        onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        placeholder="utilizator@exemplu.ro"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-password">Parolă nouă (opțional)</Label>
                      <Input
                        id="edit-password"
                        type="password"
                        placeholder="Lasă gol pentru a păstra parola actuală"
                        value={editUserData.password}
                        onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Rol</Label>
                      <Select
                        value={editUserData.role}
                        onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}
                      >
                        <SelectTrigger id="edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-orange-500" />
                              Administrator
                            </div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-blue-500" />
                              Utilizator
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Anulează
                    </Button>
                    <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending ? 'Se actualizează...' : 'Salvează modificările'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {isLoading ? (
                <div className="text-center py-12 text-gray-500">
                  Se încarcă utilizatorii...
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 font-semibold mb-2">Eroare la încărcarea utilizatorilor</div>
                  <div className="text-gray-600 text-sm">{error.message}</div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nu există utilizatori înregistrați</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px] text-center">Utilizator</TableHead>
                        <TableHead className="w-[250px] text-center">Email</TableHead>
                        <TableHead className="w-[180px] text-center">Rol</TableHead>
                        <TableHead className="w-[150px] text-center">Status</TableHead>
                        <TableHead className="w-[100px] text-center">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium w-[250px]">
                            <div className="flex items-center justify-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-blue-600">
                                  {(user.full_name || user.email)?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <span className="truncate" title={user.full_name || user.email}>
                                {user.full_name || user.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="w-[250px] text-center">
                            <div className="truncate" title={user.email}>
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="w-[180px]">
                            <div className="flex justify-center">
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user.id, value)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-orange-500" />
                                      Administrator
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="user">
                                    <div className="flex items-center gap-2">
                                      <UserIcon className="w-4 h-4 text-blue-500" />
                                      Utilizator
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="w-[150px]">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={user.is_active}
                                onCheckedChange={() => handleToggleActive(user.id, user.is_active)}
                              />
                              <Badge variant={user.is_active ? "default" : "secondary"}>
                                {user.is_active ? 'Activ' : 'Inactiv'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="w-[100px]">
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEditUser(user)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Această acțiune nu poate fi anulată. Utilizatorul <strong>{user.email}</strong> va fi șters permanent din sistem.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Anulează</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Șterge utilizatorul
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
