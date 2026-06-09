export interface Issue {
  slug: string;
  name: string;
  date: string;
  oxfordTerm: string;
  folder: string;
  pageCount: number;
  editors: string[];
  /**
   * How this issue's pages are delivered. Defaults to 'images' (pre-rendered
   * PNGs in `folder`). 'pdf' renders a single web-optimized PDF directly in the
   * browser via pdf.js -- `pdfUrl` must be set in that case.
   */
  source?: 'images' | 'pdf';
  /** URL of the linearized PDF, required when `source` is 'pdf'. */
  pdfUrl?: string;
  /**
   * Cover thumbnail shown on the issue cards. Defaults to
   * `/magazines/covers/<slug>.png`; set this to override the path/extension.
   */
  cover?: string;
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