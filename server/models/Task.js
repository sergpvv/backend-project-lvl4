import objectionUnique from 'objection-unique';
import { Model } from 'objection';
import BaseModel from './BaseModel.js';
import TaskStatus from './TaskStatus.js';
import User from './User.js';
import Label from './Label.js';

const unique = objectionUnique({ fields: ['name'] });

export default class Task extends unique(BaseModel) {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        statusId: { type: 'integer', minimum: 1 },
        creatorId: { type: 'integer', minimum: 1 },
        executorId: {
          anyOf: [
            { type: 'integer', minimum: 0 },
            { type: 'string', minLength: 1, maxLength: 5 },
            { type: 'null' },
          ],
        },
      },
    };
  }

  static get relationMappings() {
    return {
      status: {
        relation: Model.BelongsToOneRelation,
        modelClass: TaskStatus,
        join: {
          from: 'tasks.statusId ',
          to: 'statuses.id',
        },
      },
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
      },
      labels: {
        relation: Model.HasOneThroughRelation,
        modelClass: Label,
        join: {
          from: 'tasks.id',
          through: {
            from: 'tasks_labels.taskId',
            to: 'tasks_labels.labelId',
          },
          to: 'labels.id',
        },
      },
    };
  }

  static modifiers = {
    status(query, id) {
      query.where('statusId', id);
    },
    executor(query, id) {
      query.where('executorId', id);
    },
    creator(query, id) {
      query.where('creatorId', id);
    },
  };
}
