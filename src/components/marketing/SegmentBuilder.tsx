import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

export interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface RuleGroup {
  id: string;
  condition: 'AND' | 'OR';
  rules: Rule[];
}

interface SegmentBuilderProps {
  value: RuleGroup;
  onChange: (value: RuleGroup) => void;
}

const FIELDS = [
  { value: 'last_login', label: 'Dernière connexion' },
  { value: 'total_spent', label: 'Total dépensé' },
  { value: 'order_count', label: 'Nombre de commandes' },
  { value: 'account_age_days', label: 'Ancienneté (jours)' },
  { value: 'country', label: 'Pays' },
];

const OPERATORS = [
  { value: 'equals', label: 'Est égal à' },
  { value: 'not_equals', label: "N'est pas égal à" },
  { value: 'greater_than', label: 'Est supérieur à' },
  { value: 'less_than', label: 'Est inférieur à' },
  { value: 'contains', label: 'Contient' },
];

export const SegmentBuilder: React.FC<SegmentBuilderProps> = ({ value, onChange }) => {
  const addRule = () => {
    const newRule: Rule = {
      id: Math.random().toString(36).substring(7),
      field: 'total_spent',
      operator: 'greater_than',
      value: ''
    };
    onChange({
      ...value,
      rules: [...value.rules, newRule]
    });
  };

  const updateRule = (ruleId: string, updates: Partial<Rule>) => {
    onChange({
      ...value,
      rules: value.rules.map(rule => rule.id === ruleId ? { ...rule, ...updates } : rule)
    });
  };

  const removeRule = (ruleId: string) => {
    onChange({
      ...value,
      rules: value.rules.filter(rule => rule.id !== ruleId)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium">Les utilisateurs doivent correspondre à</span>
        <Select 
          value={value.condition} 
          onValueChange={(cond: 'AND' | 'OR') => onChange({ ...value, condition: cond })}
        >
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">TOUTES</SelectItem>
            <SelectItem value="OR">AU MOINS UNE</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm font-medium">des règles suivantes :</span>
      </div>

      <div className="space-y-3">
        {value.rules.map((rule, index) => (
          <div key={rule.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-100">
            {index > 0 && (
              <div className="w-12 text-center text-xs font-bold text-gray-400">
                {value.condition}
              </div>
            )}
            <Select 
              value={rule.field} 
              onValueChange={(val) => updateRule(rule.id, { field: val })}
            >
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Champ" />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={rule.operator} 
              onValueChange={(val) => updateRule(rule.id, { operator: val })}
            >
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Opérateur" />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input 
              value={rule.value} 
              onChange={(e) => updateRule(rule.id, { value: e.target.value })}
              placeholder="Valeur"
              className="flex-1 bg-white"
            />

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => removeRule(rule.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={addRule}
        className="mt-4 border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une règle
      </Button>
    </div>
  );
};
