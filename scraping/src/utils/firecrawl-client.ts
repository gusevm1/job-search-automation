import { appConfig } from "../config/index.js";

/**
 * Firecrawl API response types
 */
export interface FirecrawlScrapeOptions {
  url: string;
  formats?: ("markdown" | "html" | "rawHtml" | "links" | "screenshot")[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
}

export interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

export interface FirecrawlExtractOptions {
  url: string;
  prompt: string;
  schema?: Record<string, unknown>;
}

export interface FirecrawlExtractResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Firecrawl API client for web scraping
 */
export class FirecrawlClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || appConfig.firecrawl.apiKey;
    this.baseUrl = baseUrl || appConfig.firecrawl.baseUrl;

    if (!this.apiKey) {
      throw new Error("Firecrawl API key is required");
    }
  }

  /**
   * Scrape a single URL
   */
  async scrape(options: FirecrawlScrapeOptions): Promise<FirecrawlScrapeResult> {
    const response = await fetch(`${this.baseUrl}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        url: options.url,
        formats: options.formats || ["markdown"],
        onlyMainContent: options.onlyMainContent ?? true,
        includeTags: options.includeTags,
        excludeTags: options.excludeTags,
        waitFor: options.waitFor,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Extract structured data from a URL using AI
   */
  async extract(options: FirecrawlExtractOptions): Promise<FirecrawlExtractResult> {
    const response = await fetch(`${this.baseUrl}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        url: options.url,
        formats: ["extract"],
        extract: {
          prompt: options.prompt,
          schema: options.schema,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data?.extract,
    };
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.scrape({
        url: "https://example.com",
        formats: ["markdown"],
      });
      return result.success;
    } catch {
      return false;
    }
  }
}

// Default client instance
let defaultClient: FirecrawlClient | null = null;

/**
 * Get the default Firecrawl client instance
 */
export function getFirecrawlClient(): FirecrawlClient {
  if (!defaultClient) {
    defaultClient = new FirecrawlClient();
  }
  return defaultClient;
}
