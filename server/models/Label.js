import objectionUnique from 'objection-unique';
import { Model } from 'objection';
import BaseModel from './BaseModel.js';
import Task from './Task.js';

const unique = objectionUnique({ fields: ['name'] });

export default class Label extends unique(BaseModel) {
  static get tableName() {
    return 'labels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
      },
    };
  }

  static relationMappings = {
    task: {
      relation: Model.HasOneThroughRelation,
      modelClass: Task,
      join: {
        from: 'labels.id',
        through: {
          from: 'tasks_labels.labelId',
          to: 'tasks_labels.taskId',
        },
        to: 'tasks.Id ',
      },
    },
  };
}
