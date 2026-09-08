import { randomBytes } from 'crypto';
process.env.JWT_SECRET ??= randomBytes(32).toString('hex');
process.env.INTERNAL_SERVICE_TOKEN ??= randomBytes(32).toString('hex');
