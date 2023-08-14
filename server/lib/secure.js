// @ts-check

import { createHash } from 'node:crypto';

export default (value) => createHash('sha256')
  .update(value)
  .digest('hex');
