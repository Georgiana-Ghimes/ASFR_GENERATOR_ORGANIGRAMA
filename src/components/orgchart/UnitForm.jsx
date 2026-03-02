import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';

const defaultColors = [
  { label: 'Verde deschis', value: '#86C67C', border: '#6BA85C' },
  { label: 'Verde complet', value: '#86C67C-full', border: '#6BA85C' },
  { label: 'Roz', value: '#E8B4D4', border: '#D89CC4' },
  { label: 'Roz complet', value: '#E8B4D4-full', border: '#D89CC4' },
  { label: 'Galben', value: '#F4E03C', border: '#E4D02C' },
  { label: 'Galben complet', value: '#F4E03C-full', border: '#E4D02C' },
  { label: 'Albastru', value: '#8CB4D4', border: '#6C94B4' },
  { label: 'Albastru complet', value: '#8CB4D4-full', border: '#6C94B4' },
  { label: 'Portocaliu', value: '#F4A43C', border: '#E4942C' },
  { label: 'Portocaliu complet', value: '#F4A43C-full', border: '#E4942C' },
];

export default function UnitForm({ unit, units, versionId, onSave, onCancel, isReadOnly }) {
  // Fetch unit types from backend
  const { data: unitTypes = [] } = useQuery({
    queryKey: ['unit-types'],
    queryFn: () => apiClient.listUnitTypes()
  });

  const [formData, setFormData] = useState({
    stas_code: '',
    name: '',
    unit_type: 'compartiment',
    parent_unit_id: '',
    order_index: 0,
    leadership_count: 0,
    execution_count: 0,
    color: '',
    director_title: '',
    director_name: '',
    legend_col1: '',
    legend_col2: '',
    legend_col3: '',
  });

  // Check if this is the special consiliu unit
  const isConsiliu = unit?.unit_type === 'consiliu' || unit?.stas_code === '330';
  
  // Check if this is the director mini-legend (not the actual director_general unit)
  const isDirectorMiniLegend = unit?._isDirectorMiniLegend === true;
  
  // Check if this is the special legend unit
  const isLegend = unit?.unit_type === 'legend';

  useEffect(() => {
    if (unit) {
      setFormData({
        stas_code: unit.stas_code || '',
        name: unit.name || '',
        unit_type: unit.unit_type || 'compartiment',
        parent_unit_id: unit.parent_unit_id || '',
        order_index: unit.order_index || 0,
        leadership_count: unit.leadership_count || 0,
        execution_count: unit.execution_count || 0,
        color: unit.color || '',
        director_title: unit.director_title || '',
        director_name: unit.director_name || '',
        legend_col1: unit.legend_col1 || '',
        legend_col2: unit.legend_col2 || '',
        legend_col3: unit.legend_col3 || '',
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

  const availableParents = units
    .filter(u => u.id !== unit?.id)
    .filter(u => u.unit_type !== 'consiliu' && u.unit_type !== 'legend' && u.stas_code !== '330')
    .sort((a, b) => {
      const codeA = parseInt(a.stas_code) || 0;
      const codeB = parseInt(b.stas_code) || 0;
      return codeA - codeB;
    });

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
        {isLegend ? (
          // Special form for Legend
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                Aceasta este legenda editabilă. Puteți modifica textele din cele 3 coloane.
              </p>
            </div>

            <div>
              <Label htmlFor="legend_col1">Coloana 1 *</Label>
              <Input
                id="legend_col1"
                value={formData.legend_col1}
                onChange={(e) => setFormData({ ...formData, legend_col1: e.target.value })}
                placeholder="ex: NUMĂR POSTURI CONDUCERE"
                required
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label htmlFor="legend_col2">Coloana 2 *</Label>
              <Input
                id="legend_col2"
                value={formData.legend_col2}
                onChange={(e) => setFormData({ ...formData, legend_col2: e.target.value })}
                placeholder="ex: TOTAL POSTURI INCLUS CONDUCERE"
                required
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label htmlFor="legend_col3">Coloana 3 *</Label>
              <Input
                id="legend_col3"
                value={formData.legend_col3}
                onChange={(e) => setFormData({ ...formData, legend_col3: e.target.value })}
                placeholder="ex: DENUMIRE STRUCTURĂ"
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Anulează
              </Button>
              {!isReadOnly && (
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Salvează
                </Button>
              )}
            </div>
          </form>
        ) : isDirectorMiniLegend ? (
          // Special form for Director Mini-Legend (the fixed element)
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                Aceasta este mini-legenda Director General. Puteți modifica funcția și numele directorului.
              </p>
            </div>

            <div>
              <Label htmlFor="director_title">Funcție *</Label>
              <Input
                id="director_title"
                value={formData.director_title}
                onChange={(e) => setFormData({ ...formData, director_title: e.target.value })}
                placeholder="ex: DIRECTOR GENERAL"
                required
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label htmlFor="director_name">Nume *</Label>
              <Input
                id="director_name"
                value={formData.director_name}
                onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                placeholder="ex: Petru BOGDAN"
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Anulează
              </Button>
              {!isReadOnly && (
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Salvează
                </Button>
              )}
            </div>
          </form>
        ) : isConsiliu ? (
          // Special simplified form for Consiliu
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                Aceasta este o unitate specială. Puteți modifica doar denumirea.
              </p>
            </div>

            <div>
              <Label htmlFor="name">Denumire *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Denumirea consiliului"
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Anulează
              </Button>
              {!isReadOnly && (
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Salvează
                </Button>
              )}
            </div>
          </form>
        ) : (
          // Regular form for normal units
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stas_code">Cod *</Label>
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
                  {unitTypes
                    .filter(ut => ut.code !== 'consiliu' && ut.code !== 'legend')
                    .map((unitType) => (
                      <SelectItem key={unitType.code} value={unitType.code}>
                        {unitType.label}
                      </SelectItem>
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

          {/* Position counts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="leadership_count">Posturi Conducere</Label>
              <Input
                id="leadership_count"
                type="number"
                min="0"
                value={formData.leadership_count}
                onChange={(e) => setFormData({ ...formData, leadership_count: parseInt(e.target.value) || 0 })}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="execution_count">Posturi Execuție</Label>
              <Input
                id="execution_count"
                  type="number"
                  min="0"
                  value={formData.execution_count}
                  onChange={(e) => setFormData({ ...formData, execution_count: parseInt(e.target.value) || 0 })}
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
                  {defaultColors.map((c) => {
                    const baseColor = c.value.replace('-full', '');
                    return (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: baseColor }} />
                          {c.label}
                        </div>
                      </SelectItem>
                    );
                  })}
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
        )}
      </CardContent>
    </Card>
  );
}