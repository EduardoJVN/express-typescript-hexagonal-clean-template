export interface IRateLimiter {
  // Returns true if within limit, false if exceeded
  // key: unique identifier (e.g., 'resend:userId' or 'resend:ip:192.168.1.1')
  // windowMs: duration of the window in milliseconds
  // maxAttempts: maximum allowed in the window
  // Increments the counter on each call
  checkAndIncrement(key: string, windowMs: number, maxAttempts: number): Promise<boolean>;
}
