export interface Theme {
  id: string;
  title: string;
  description: string;
  clickPrice: number;
  previewHtml: string; // Storing HTML string for the demo
  monetagLink: string;
  referralLink?: string;
  author: string;
  downloads: number;
  createdAt?: any;
}

export interface UserTheme {
  id: string;
  userId: string;
  originalThemeId: string;
  title: string;
  description: string;
  previewHtml: string;
  createdAt: any;
  updatedAt: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  unlockedThemeIds: string[];
  isAdmin: boolean;
}

export enum ViewState {
  HOME = 'HOME',
  THEMES = 'THEMES',
  THEME_DETAILS = 'THEME_DETAILS',
  MY_THEMES = 'MY_THEMES',
  AI_EDITOR = 'AI_EDITOR',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  LIVE_PREVIEW = 'LIVE_PREVIEW'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}