import { ReactNode } from 'react';

export interface SQLQuery {
  id: string;
  naturalLanguage: string;
  sqlQuery: string;
  confidence: number;
  timestamp: Date;
}

export interface MessageHistory {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  sqlQuery?: string;
  table?: string;
  chart?: any;
}

export type TabId = 'chat' | 'analytics' | 'data' | 'settings';

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

export type Theme = 'light' | 'dark';