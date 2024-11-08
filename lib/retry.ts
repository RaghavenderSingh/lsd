interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoff?: boolean;
    shouldRetry?: (error: any) => boolean;
    onRetry?: (error: any, attempt: number) => void;
  }
  
  export class RetryError extends Error {
    public attempts: number;
    public lastError: Error;
  
    constructor(message: string, attempts: number, lastError: Error) {
      super(message);
      this.name = 'RetryError';
      this.attempts = attempts;
      this.lastError = lastError;
    }
  }
  
  /**
   * Retries an async operation with exponential backoff
   * @param operation Function to retry
   * @param options Retry configuration options
   */
  export async function retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoff = true,
      shouldRetry = () => true,
      onRetry = () => {}
    } = options;
  
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
  
        // Check if we should retry this error
        if (!shouldRetry(error)) {
          throw new RetryError(
            `Operation failed, retry aborted: ${error.message}`,
            attempt,
            error
          );
        }
  
        // If this was our last attempt, throw the error
        if (attempt === maxAttempts) {
          throw new RetryError(
            `Operation failed after ${attempt} attempts: ${error.message}`,
            attempt,
            error
          );
        }
  
        // Calculate delay for next attempt
        const delay = backoff
          ? Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)
          : initialDelay;
  
        // Call the onRetry callback
        onRetry(error, attempt);
  
        // Log the retry attempt
        console.log(
          `Retry attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`,
          error
        );
  
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  
    // This should never happen due to the throw in the loop,
    // but TypeScript needs it
    throw new RetryError(
      `Operation failed after ${maxAttempts} attempts`,
      maxAttempts,
      lastError!
    );
  }
  
  /**
   * Creates a reusable retry configuration
   * @param defaultOptions Default retry options
   */
  export function createRetryConfig(defaultOptions: RetryOptions) {
    return async function retryWithConfig<T>(
      operation: () => Promise<T>,
      overrideOptions: Partial<RetryOptions> = {}
    ) {
      return retry(operation, { ...defaultOptions, ...overrideOptions });
    };
  }
  
  // Predefined retry configurations
  export const retryConfigs = {
    // For critical operations like financial transactions
    critical: createRetryConfig({
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoff: true,
      onRetry: (error, attempt) => {
        console.error(`Critical operation retry ${attempt}:`, error);
        // Here you might want to log to an external service
      }
    }),
  
    // For less critical operations
    standard: createRetryConfig({
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      backoff: true
    }),
  
    // For operations that should retry quickly
    quick: createRetryConfig({
      maxAttempts: 2,
      initialDelay: 500,
      maxDelay: 1000,
      backoff: false
    })
  };