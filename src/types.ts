export interface Issue {
  slug: string;
  name: string;
  date: string;
  oxfordTerm: string;
  folder: string;
  pageCount: number;
  editors: string[];
}

export interface Article {
  id: string;
  title: string;
  author: string;
  pages: number[];
}

export interface IssueMeta {
  slug: string;
  articles: Article[];
} 