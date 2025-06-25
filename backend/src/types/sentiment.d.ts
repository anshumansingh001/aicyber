declare module 'sentiment' {
  export class Sentiment {
    constructor(options?: any);
    analyze(text: string): {
      score: number;
      comparative: number;
      calculation: any[];
      tokens: string[];
      words: string[];
      positive: string[];
      negative: string[];
    };
  }
} 