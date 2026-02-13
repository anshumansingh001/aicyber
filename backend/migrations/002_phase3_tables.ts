import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Organizations table
  await knex.schema.createTable('organizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('plan', 50).notNullable().defaultTo('free');
    table.jsonb('settings').defaultTo('{}');
    table.timestamps(true, true);
  });

  // Add organization_id to users
  await knex.schema.alterTable('users', (table) => {
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('SET NULL');
  });

  // Add organization_id to security_events
  await knex.schema.alterTable('security_events', (table) => {
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('SET NULL');
  });

  // Organization invites
  await knex.schema.createTable('organization_invites', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('role', 50).notNullable().defaultTo('user');
    table.uuid('invited_by').references('id').inTable('users').onDelete('SET NULL');
    table.enum('status', ['pending', 'accepted', 'expired']).notNullable().defaultTo('pending');
    table.timestamps(true, true);
  });

  // Incidents table
  await knex.schema.createTable('incidents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 500).notNullable();
    table.text('description');
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium');
    table.string('source', 255);
    table.enum('status', ['open', 'investigating', 'contained', 'resolved', 'closed']).notNullable().defaultTo('open');
    table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('reported_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('SET NULL');
    table.timestamp('resolved_at');
    table.timestamps(true, true);
    table.index('status');
    table.index('severity');
    table.index('organization_id');
  });

  // Incident notes
  await knex.schema.createTable('incident_notes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('incident_id').notNullable().references('id').inTable('incidents').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.text('content').notNullable();
    table.timestamps(true, true);
    table.index('incident_id');
  });

  // API keys table
  await knex.schema.createTable('api_keys', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('key_hash', 64).notNullable();
    table.string('prefix', 20).notNullable();
    table.string('name', 255).notNullable().defaultTo('API Key');
    table.jsonb('permissions').defaultTo('["read"]');
    table.integer('rate_limit').notNullable().defaultTo(1000);
    table.timestamp('last_used_at');
    table.timestamp('expires_at').notNullable();
    table.timestamps(true, true);
    table.index('key_hash');
    table.index('user_id');
  });

  // Alert rules table
  await knex.schema.createTable('alert_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.text('description');
    table.jsonb('condition').notNullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium');
    table.boolean('enabled').notNullable().defaultTo(true);
    table.jsonb('notification_channels').defaultTo('["email"]');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  // AI models registry table
  await knex.schema.createTable('ai_models', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('version', 50).notNullable();
    table.string('type', 100).notNullable();
    table.enum('status', ['training', 'active', 'retired', 'failed']).notNullable().defaultTo('training');
    table.jsonb('metrics').defaultTo('{}');
    table.jsonb('hyperparameters').defaultTo('{}');
    table.string('file_path', 500);
    table.timestamps(true, true);
    table.index('name');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_models');
  await knex.schema.dropTableIfExists('alert_rules');
  await knex.schema.dropTableIfExists('api_keys');
  await knex.schema.dropTableIfExists('incident_notes');
  await knex.schema.dropTableIfExists('incidents');
  await knex.schema.dropTableIfExists('organization_invites');
  await knex.schema.alterTable('security_events', (table) => {
    table.dropColumn('organization_id');
  });
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('organization_id');
  });
  await knex.schema.dropTableIfExists('organizations');
}
