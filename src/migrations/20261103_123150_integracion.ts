import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_messages_estado" AS ENUM('nuevo', 'respondido');
  CREATE TABLE "payload"."messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"asunto" varchar NOT NULL,
  	"mensaje" varchar NOT NULL,
  	"estado" "payload"."enum_messages_estado" DEFAULT 'nuevo' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"origen" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."site_texts_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"pregunta" varchar NOT NULL,
  	"respuesta" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nosotros" jsonb,
  	"terminos" jsonb,
  	"privacidad" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_site_texts_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"pregunta" varchar NOT NULL,
  	"respuesta" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_site_texts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_nosotros" jsonb,
  	"version_terminos" jsonb,
  	"version_privacidad" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."books" ADD COLUMN "audio_sample_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "messages_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "subscribers_id" integer;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "remitente_nombre" varchar DEFAULT 'Editorial La Polilla';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "remitente_direccion" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "remitente_comuna" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "remitente_region" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "remitente_telefono" varchar;
  ALTER TABLE "payload"."site_texts_faq" ADD CONSTRAINT "site_texts_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_texts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_site_texts_v_version_faq" ADD CONSTRAINT "_site_texts_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_site_texts_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "messages_updated_at_idx" ON "payload"."messages" USING btree ("updated_at");
  CREATE INDEX "messages_created_at_idx" ON "payload"."messages" USING btree ("created_at");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "payload"."subscribers" USING btree ("email");
  CREATE INDEX "subscribers_updated_at_idx" ON "payload"."subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "payload"."subscribers" USING btree ("created_at");
  CREATE INDEX "site_texts_faq_order_idx" ON "payload"."site_texts_faq" USING btree ("_order");
  CREATE INDEX "site_texts_faq_parent_id_idx" ON "payload"."site_texts_faq" USING btree ("_parent_id");
  CREATE INDEX "_site_texts_v_version_faq_order_idx" ON "payload"."_site_texts_v_version_faq" USING btree ("_order");
  CREATE INDEX "_site_texts_v_version_faq_parent_id_idx" ON "payload"."_site_texts_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_site_texts_v_created_at_idx" ON "payload"."_site_texts_v" USING btree ("created_at");
  CREATE INDEX "_site_texts_v_updated_at_idx" ON "payload"."_site_texts_v" USING btree ("updated_at");
  ALTER TABLE "payload"."books" ADD CONSTRAINT "books_audio_sample_id_media_public_files_id_fk" FOREIGN KEY ("audio_sample_id") REFERENCES "payload"."media_public_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_messages_fk" FOREIGN KEY ("messages_id") REFERENCES "payload"."messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "payload"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "books_audio_sample_idx" ON "payload"."books" USING btree ("audio_sample_id");
  CREATE INDEX "payload_locked_documents_rels_messages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("messages_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("subscribers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."subscribers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."site_texts_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."site_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_site_texts_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_site_texts_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."messages" CASCADE;
  DROP TABLE "payload"."subscribers" CASCADE;
  DROP TABLE "payload"."site_texts_faq" CASCADE;
  DROP TABLE "payload"."site_texts" CASCADE;
  DROP TABLE "payload"."_site_texts_v_version_faq" CASCADE;
  DROP TABLE "payload"."_site_texts_v" CASCADE;
  ALTER TABLE "payload"."books" DROP CONSTRAINT "books_audio_sample_id_media_public_files_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_messages_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscribers_fk";
  
  DROP INDEX "payload"."books_audio_sample_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_messages_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_subscribers_id_idx";
  ALTER TABLE "payload"."books" DROP COLUMN "audio_sample_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "messages_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "subscribers_id";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "remitente_nombre";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "remitente_direccion";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "remitente_comuna";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "remitente_region";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "remitente_telefono";
  DROP TYPE "payload"."enum_messages_estado";`)
}
