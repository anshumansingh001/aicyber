import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.enum('role', ['user', 'analyst', 'admin']).notNullable().defaultTo('user');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_login');
    table.timestamps(true, true);
  });

  // Sessions table
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('refresh_token').notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamps(true, true);
    table.index('user_id');
    table.index('refresh_token');
  });

  // Security events table
  await knex.schema.createTable('security_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('type', 100).notNullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('low');
    table.string('source', 255);
    table.string('target', 255);
    table.text('description');
    table.jsonb('payload').defaultTo('{}');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('ip_address', 45);
    table.timestamps(true, true);
    table.index('type');
    table.index('severity');
    table.index('user_id');
    table.index('created_at');
  });

  // Security scans table
  await knex.schema.createTable('security_scans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('scan_type', 100).notNullable();
    table.string('target', 255);
    table.enum('status', ['pending', 'running', 'completed', 'failed']).notNullable().defaultTo('pending');
    table.jsonb('results').defaultTo('{}');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    table.index('user_id');
    table.index('status');
    table.index('created_at');
  });

  // Threat detections table
  await knex.schema.createTable('threat_detections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('event_id').references('id').inTable('security_events').onDelete('SET NULL');
    table.string('threat_type', 100).notNullable();
    table.float('confidence').notNullable();
    table.string('ai_model', 100);
    table.jsonb('details').defaultTo('{}');
    table.enum('status', ['active', 'mitigated', 'resolved', 'false_positive']).notNullable().defaultTo('active');
    table.timestamps(true, true);
    table.index('threat_type');
    table.index('status');
    table.index('created_at');
  });

  // Vulnerability reports table
  await knex.schema.createTable('vulnerability_reports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('scan_id').references('id').inTable('security_scans').onDelete('CASCADE');
    table.string('cve_id', 50);
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.text('description');
    table.text('remediation');
    table.float('cvss_score');
    table.enum('status', ['open', 'patched', 'accepted', 'mitigated']).notNullable().defaultTo('open');
    table.timestamps(true, true);
    table.index('scan_id');
    table.index('severity');
    table.index('status');
  });

  // AI analysis results table
  await knex.schema.createTable('ai_analysis_results', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('analysis_type', 100).notNullable();
    table.string('input_hash', 64);
    table.jsonb('results').notNullable();
    table.string('model_version', 50);
    table.float('confidence');
    table.timestamps(true, true);
    table.index('analysis_type');
    table.index('created_at');
  });

  // Audit logs table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource', 255);
    table.jsonb('details').defaultTo('{}');
    table.string('ip_address', 45);
    table.timestamps(true, true);
    table.index('user_id');
    table.index('action');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('ai_analysis_results');
  await knex.schema.dropTableIfExists('vulnerability_reports');
  await knex.schema.dropTableIfExists('threat_detections');
  await knex.schema.dropTableIfExists('security_scans');
  await knex.schema.dropTableIfExists('security_events');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('users');
}
