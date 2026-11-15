export type DashboardType = 'saas' | 'supply_chain' | 'rfm_segmentation' | 'financial_forecast';

export interface KPICardData {
  id: string;
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  benchmark: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}


export interface SkillCategory {
  title: string;
  iconName: string;
  tools: {
    name: string;
    level: string; // e.g. "Advanced", "Specialist"
    description: string;
    coreConcepts: string[];
  }[];
}

export interface QueryPreset {
  id: string;
  name: string;
  language: 'SQL' | 'Python / Pandas';
  description: string;
  code: string;
  explanation: string;
  resultRows: Record<string, string | number>[];
  columns: string[];
}
