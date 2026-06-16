import { Throttle } from '@nestjs/throttler';

// Custom throttle config
// strict rate for auth, payments
export const StrictThrottle = () =>
  Throttle({
    default: {
      ttl: 1000,
      limit: 3,
    },
  });
