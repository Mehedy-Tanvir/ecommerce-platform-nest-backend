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

//   Moderate throttle orders
export const ModerateThrottle = () =>
  Throttle({
    default: {
      ttl: 1000,
      limit: 5,
    },
  });

//   Relaxed throttle for read operations
export const RelaxedThrottle = () =>
  Throttle({
    default: {
      ttl: 1000,
      limit: 20,
    },
  });
