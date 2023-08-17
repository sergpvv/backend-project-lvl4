import objectionUnique from 'objection-unique';
import { Model } from 'objection';
import BaseModel from './BaseModel.js';
import TaskStatus from './TaskStatus';

const unique = objectionUnique({ fields: ['name'] });

export default class Task extends unique(BaseModel) {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId', 'creatorId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        statusId: { type: 'integer' },
        creatorId: { type: 'integer' },
        executorId: { type: 'integer' },
      },
    };
  }

  static get relationMappings() {
    return {
      status: {
        relation: Model.HasSingleRelation,
        modelClass: TaskStatus,
        join: {
          from: 'tasks.statusId',
          to: 'statuses.id',
        },
      },
    };
  }
}
