/**
 * Utility for generating unique IDs for sync operations
 */

export class UuidHelper {
  /**
   * Generates a unique ID for sync operations
   * Format: timestamp-randomString
   */
  static generateSyncId(): string {
    const timestamp = Date.now();
    const randomString = this.generateRandomString(8);
    return `${timestamp}-${randomString}`;
  }

  /**
   * Generates a shorter unique ID
   */
  static generateShortId(): string {
    const timestamp = Date.now() % 1000000;
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}-${random}`;
  }

  /**
   * Generates a random string of specified length
   */
  private static generateRandomString(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
