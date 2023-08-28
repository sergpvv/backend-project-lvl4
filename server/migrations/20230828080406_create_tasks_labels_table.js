// @ts-check

export const up = (knex) => (
  knex.schema.createTable('tasks_labels', (table) => {
    table
      .integer('task_id')
      .unsigned()
      .references('id')
      .inTable('tasks');
    table
      .integer('label_id')
      .unsigned()
      .references('id')
      .inTable('labels');
    table
      .primary(['task_id', 'label_id']);
    table
      .timestamp('created_at')
      .defaultTo(knex.fn.now());
  })
);

export const down = (knex) => knex.schema.dropTable('tasks_labels');

