import objectionUnique from 'objection-unique';
// import { Model } from 'objection';
import BaseModel from './BaseModel.js';
// import Task from './Task.js';

const unique = objectionUnique({ fields: ['name'] });

export default class TaskStatus extends unique(BaseModel) {
  static get tableName() {
    return 'statuses';
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
/*
  static relationMappings = {
    tasks: {
      relation: Model.HasManyRelation,
      modelClass: Task,
      join: {
        from: 'statuses.id',
        to: 'tasks.statusId ',
      },
    },
  };
*/
}
