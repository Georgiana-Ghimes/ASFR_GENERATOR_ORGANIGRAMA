import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { unitTypeLabels } from './UnitCard';

const defaultColors = [
  { label: 'Verde (Director)', value: '#22c55e' },
  { label: 'Roz (Direcție)', value: '#ec4899' },
  { label: 'Galben (Serviciu)', value: '#eab308' },
  { label: 'Albastru (Inspectorat)', value: '#3b82f6' },
  { label: 'Mov (Birou)', value: '#a855f7' },
  { label: 'Gri (Compartiment)', value: '#6b7280' },
];

export default function UnitForm({ unit, units, versionId, onSave, onCancel, isReadOnly }) {
  const [formData, setFormData] = useState({
    stas_code: '',
    name: '',
    unit_type: 'compartiment',
    parent_unit_id: '',
    order_index: 0,
    management_positions: 0,
    execution_positions: 0,
    total_positions: 0,
    color: '',
  });

  useEffect(() => {
    if (unit) {
      setFormData({
        stas_code: unit.stas_code || '',
        name: unit.name || '',
        unit_type: unit.unit_type || 'compartiment',
        parent_unit_id: unit.parent_unit_id || '',
        order_index: unit.order_index || 0,
        management_positions: unit.management_positions || 0,
        execution_positions: unit.execution_positions || 0,
        total_positions: unit.total_positions || 0,
        color: unit.color || '',
      });
    }
  }, [unit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      version_id: versionId,
      parent_unit_id: formData.parent_unit_id || null,
    });
  };

  const availableParents = units.filter(u => u.id !== unit?.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">
          {unit ? 'Editare Unitate' : 'Unitate Nouă'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stas_code">Cod STAS *</Label>
              <Input
                id="stas_code"
                value={formData.stas_code}
                onChange={(e) => setFormData({ ...formData, stas_code: e.target.value })}
                placeholder="ex: 1000"
                required
                disabled={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="unit_type">Tip Unitate *</Label>
              <Select
                value={formData.unit_type}
                onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(unitTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Denumire *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Denumirea unității"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <Label htmlFor="parent">Unitate Părinte</Label>
            <Select
              value={formData.parent_unit_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, parent_unit_id: value === 'none' ? '' : value })}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectați unitatea părinte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Fără părinte (unitate rădăcină) —</SelectItem>
                {availableParents.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.stas_code} - {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="management_positions">Posturi Conducere</Label>
              <Input
                id="management_positions"
                type="number"
                min="0"
                value={formData.management_positions}
                onChange={(e) => setFormData({ ...formData, management_positions: parseInt(e.target.value) || 0 })}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="execution_positions">Posturi Execuție</Label>
              <Input
                id="execution_positions"
                type="number"
                min="0"
                value={formData.execution_positions}
                onChange={(e) => setFormData({ ...formData, execution_positions: parseInt(e.target.value) || 0 })}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="total_positions">Total Posturi</Label>
              <Input
                id="total_positions"
                type="number"
                min="0"
                value={formData.total_positions}
                onChange={(e) => setFormData({ ...formData, total_positions: parseInt(e.target.value) || 0 })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="color">Culoare</Label>
              <Select
                value={formData.color || 'default'}
                onValueChange={(value) => setFormData({ ...formData, color: value === 'default' ? '' : value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Culoare implicită" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Culoare implicită</SelectItem>
                  {defaultColors.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="order_index">Ordine Afișare</Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Anulare
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Salvare
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}