import fs from 'fs';
import path from 'path';
import { NutritionAnalysis } from '../types/nutrition';
import { ReceiptItem } from '../types/receipt';

export interface ReceiptHistory {
  id: string;
  date: Date;
  storeName: string | null;
  location: string | null;
  items: ReceiptItem[];
  nutritionAnalysis: NutritionAnalysis;
  totalItems: number;
  averagePrice: number;
}

export interface HistoryStats {
  totalReceipts: number;
  averageHealthScore: number;
  averageSodium: number;
  averageProcessingScore: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  recentRecommendations: Array<{
    type: 'swap' | 'reduce' | 'add';
    priority: 'high' | 'medium' | 'low';
    message: string;
    reason: string;
  }>;
}

export class HistoryService {
  private historyDir: string;
  private historyFile: string;

  constructor() {
    this.historyDir = path.join(process.cwd(), 'data');
    this.historyFile = path.join(this.historyDir, 'receipt-history.json');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
      console.log('📁 Created data directory for receipt history');
    }

    if (!fs.existsSync(this.historyFile)) {
      fs.writeFileSync(this.historyFile, JSON.stringify([]));
      console.log('📄 Created receipt history file');
    }
  }

  /**
   * Save a new receipt analysis to history
   */
  async saveReceipt(
    items: ReceiptItem[],
    nutritionAnalysis: NutritionAnalysis,
    storeInfo: { storeName: string | null; location: string | null },
    receiptDate?: Date
  ): Promise<string> {
    try {
      const receiptId = this.generateReceiptId();
      const totalItems = items.length;
      const averagePrice = totalItems > 0 
        ? Math.round((items.reduce((sum, item) => sum + item.price, 0) / totalItems) * 100) / 100
        : 0;

      const receiptHistory: ReceiptHistory = {
        id: receiptId,
        date: receiptDate || new Date(),
        storeName: storeInfo.storeName,
        location: storeInfo.location,
        items,
        nutritionAnalysis,
        totalItems,
        averagePrice
      };

      const history = this.loadHistory();
      history.push(receiptHistory);

      // Keep only last 100 receipts to prevent file from growing too large
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
      console.log(`💾 Saved receipt to history: ${receiptId}`);

      return receiptId;
    } catch (error) {
      console.error('❌ Failed to save receipt to history:', error);
      throw error;
    }
  }

  /**
   * Get recent receipt history
   */
  getRecentHistory(limit: number = 10): ReceiptHistory[] {
    try {
      const history = this.loadHistory();
      return history
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to load receipt history:', error);
      return [];
    }
  }

  /**
   * Get history statistics and trends
   */
  getHistoryStats(): HistoryStats {
    try {
      const history = this.loadHistory();
      
      if (history.length === 0) {
        return {
          totalReceipts: 0,
          averageHealthScore: 0,
          averageSodium: 0,
          averageProcessingScore: 0,
          trendDirection: 'stable',
          recentRecommendations: []
        };
      }

      // Calculate averages
      const totalReceipts = history.length;
      const averageHealthScore = Math.round(
        history.reduce((sum, receipt) => sum + receipt.nutritionAnalysis.overallScore, 0) / totalReceipts
      );
      const averageSodium = Math.round(
        history.reduce((sum, receipt) => sum + receipt.nutritionAnalysis.averageSodium, 0) / totalReceipts
      );
      const averageProcessingScore = Math.round(
        history.reduce((sum, receipt) => sum + receipt.nutritionAnalysis.processingScore, 0) / totalReceipts
      );

      // Calculate trend (comparing last 3 vs previous 3)
      let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
      if (history.length >= 6) {
        const recent = history.slice(-3);
        const previous = history.slice(-6, -3);
        
        const recentAvg = recent.reduce((sum, r) => sum + r.nutritionAnalysis.overallScore, 0) / 3;
        const previousAvg = previous.reduce((sum, r) => sum + r.nutritionAnalysis.overallScore, 0) / 3;
        
        if (recentAvg > previousAvg + 5) {
          trendDirection = 'improving';
        } else if (recentAvg < previousAvg - 5) {
          trendDirection = 'declining';
        }
      }

      // Get most recent recommendations
      const recentRecommendations = history.length > 0 
        ? history[history.length - 1].nutritionAnalysis.recommendations.slice(0, 3)
        : [];

      return {
        totalReceipts,
        averageHealthScore,
        averageSodium,
        averageProcessingScore,
        trendDirection,
        recentRecommendations
      };
    } catch (error) {
      console.error('❌ Failed to calculate history stats:', error);
      return {
        totalReceipts: 0,
        averageHealthScore: 0,
        averageSodium: 0,
        averageProcessingScore: 0,
        trendDirection: 'stable',
        recentRecommendations: []
      };
    }
  }

  /**
   * Get a specific receipt by ID
   */
  getReceiptById(id: string): ReceiptHistory | null {
    try {
      const history = this.loadHistory();
      return history.find(receipt => receipt.id === id) || null;
    } catch (error) {
      console.error('❌ Failed to find receipt:', error);
      return null;
    }
  }

  /**
   * Delete old receipts (older than 30 days)
   */
  cleanupOldReceipts(): number {
    try {
      const history = this.loadHistory();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filteredHistory = history.filter(receipt => 
        new Date(receipt.date) > thirtyDaysAgo
      );

      const deletedCount = history.length - filteredHistory.length;
      
      if (deletedCount > 0) {
        fs.writeFileSync(this.historyFile, JSON.stringify(filteredHistory, null, 2));
        console.log(`🧹 Cleaned up ${deletedCount} old receipts`);
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old receipts:', error);
      return 0;
    }
  }

  private loadHistory(): ReceiptHistory[] {
    try {
      const data = fs.readFileSync(this.historyFile, 'utf8');
      const history = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return history.map((receipt: any) => ({
        ...receipt,
        date: new Date(receipt.date)
      }));
    } catch (error) {
      console.warn('⚠️ Could not load history, starting fresh:', error);
      return [];
    }
  }

  private generateReceiptId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `receipt_${timestamp}_${random}`;
  }
}