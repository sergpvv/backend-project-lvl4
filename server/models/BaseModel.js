// @ts-check

import { fileURLToPath } from 'url';
import path from 'path';
import { Model } from 'objection';

const __dirname = fileURLToPath(path.dirname(import.meta.url));

export default class BaseModel extends Model {
  static get modelPaths() {
    return [__dirname];
  }
}
