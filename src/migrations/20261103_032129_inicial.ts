import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_books_fulfillment" AS ENUM('stock', 'pod');
  CREATE TYPE "payload"."enum_books_status" AS ENUM('borrador', 'preventa', 'publicado');
  CREATE TYPE "payload"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_orders_items_format" AS ENUM('digital', 'fisico');
  CREATE TYPE "payload"."enum_orders_status" AS ENUM('pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado', 'reembolsado');
  CREATE TYPE "payload"."enum_orders_currency" AS ENUM('CLP', 'USD');
  CREATE TYPE "payload"."enum_orders_gateway" AS ENUM('mercadopago', 'lemonsqueezy');
  CREATE TYPE "payload"."enum_orders_shipment_carrier" AS ENUM('Starken', 'Chilexpress', 'Blue Express', 'Retiro');
  CREATE TYPE "payload"."enum_protected_files_kind" AS ENUM('epub', 'pdf', 'audio');
  CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editora', 'autora', 'cliente');
  CREATE TABLE "payload"."books_audio_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"file_id" integer NOT NULL,
  	"duration_sec" numeric
  );
  
  CREATE TABLE "payload"."books" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"cover_id" integer,
  	"synopsis" jsonb,
  	"sample_id" integer,
  	"trailer_youtube" varchar,
  	"isbn" varchar,
  	"pages" numeric,
  	"published_at" timestamp(3) with time zone,
  	"digital_enabled" boolean DEFAULT true,
  	"price_digital_c_l_p" numeric,
  	"price_digital_u_s_d" numeric,
  	"physical_enabled" boolean DEFAULT true,
  	"price_physical_c_l_p" numeric,
  	"fulfillment" "payload"."enum_books_fulfillment" DEFAULT 'stock',
  	"stock" numeric DEFAULT 0,
  	"weight_grams" numeric DEFAULT 400,
  	"epub_id" integer,
  	"pdf_id" integer,
  	"slug" varchar,
  	"status" "payload"."enum_books_status" DEFAULT 'borrador',
  	"featured" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."books_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."books_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );
  
  CREATE TABLE "payload"."authors_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"photo_id" integer,
  	"bio" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."illustrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"artist" varchar,
  	"book_id" integer,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"cover_id" integer,
  	"excerpt" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_cover_id" integer,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"book_id" integer NOT NULL,
  	"format" "payload"."enum_orders_items_format" NOT NULL,
  	"quantity" numeric DEFAULT 1,
  	"unit_price" numeric NOT NULL
  );
  
  CREATE TABLE "payload"."orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"email" varchar NOT NULL,
  	"status" "payload"."enum_orders_status" DEFAULT 'pendiente' NOT NULL,
  	"currency" "payload"."enum_orders_currency" NOT NULL,
  	"gateway" "payload"."enum_orders_gateway" NOT NULL,
  	"gateway_payment_id" varchar,
  	"subtotal" numeric NOT NULL,
  	"shipping" numeric DEFAULT 0,
  	"total" numeric NOT NULL,
  	"shipping_address_name" varchar,
  	"shipping_address_phone" varchar,
  	"shipping_address_street" varchar,
  	"shipping_address_comuna" varchar,
  	"shipping_address_region" varchar,
  	"shipping_address_notes" varchar,
  	"shipment_carrier" "payload"."enum_orders_shipment_carrier",
  	"shipment_tracking_code" varchar,
  	"invoice_folio" varchar,
  	"invoice_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."entitlements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"book_id" integer NOT NULL,
  	"order_id" integer,
  	"audio_progress" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "payload"."media_public_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."protected_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "payload"."enum_protected_files_kind" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "payload"."enum_users_role" DEFAULT 'cliente' NOT NULL,
  	"phone" varchar,
  	"rut" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"books_id" integer,
  	"authors_id" integer,
  	"illustrations_id" integer,
  	"posts_id" integer,
  	"orders_id" integer,
  	"entitlements_id" integer,
  	"media_id" integer,
  	"media_public_files_id" integer,
  	"protected_files_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_shipping_rates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" varchar NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tagline" varchar DEFAULT 'Libros que vuelan de noche',
  	"social_instagram" varchar,
  	"social_youtube" varchar,
  	"contact_email" varchar,
  	"pickup_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."books_audio_chapters" ADD CONSTRAINT "books_audio_chapters_file_id_protected_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "payload"."protected_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."books_audio_chapters" ADD CONSTRAINT "books_audio_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."books" ADD CONSTRAINT "books_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."books" ADD CONSTRAINT "books_sample_id_media_public_files_id_fk" FOREIGN KEY ("sample_id") REFERENCES "payload"."media_public_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."books" ADD CONSTRAINT "books_epub_id_protected_files_id_fk" FOREIGN KEY ("epub_id") REFERENCES "payload"."protected_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."books" ADD CONSTRAINT "books_pdf_id_protected_files_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "payload"."protected_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."books_texts" ADD CONSTRAINT "books_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."books_rels" ADD CONSTRAINT "books_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."books_rels" ADD CONSTRAINT "books_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "payload"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."authors_links" ADD CONSTRAINT "authors_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."authors" ADD CONSTRAINT "authors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."illustrations" ADD CONSTRAINT "illustrations_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."illustrations" ADD CONSTRAINT "illustrations_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "payload"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."posts" ADD CONSTRAINT "posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."orders_items" ADD CONSTRAINT "orders_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "payload"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."entitlements" ADD CONSTRAINT "entitlements_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "payload"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."entitlements" ADD CONSTRAINT "entitlements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "payload"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "payload"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "payload"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_illustrations_fk" FOREIGN KEY ("illustrations_id") REFERENCES "payload"."illustrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "payload"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_entitlements_fk" FOREIGN KEY ("entitlements_id") REFERENCES "payload"."entitlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_public_files_fk" FOREIGN KEY ("media_public_files_id") REFERENCES "payload"."media_public_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_protected_files_fk" FOREIGN KEY ("protected_files_id") REFERENCES "payload"."protected_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_shipping_rates" ADD CONSTRAINT "site_settings_shipping_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "books_audio_chapters_order_idx" ON "payload"."books_audio_chapters" USING btree ("_order");
  CREATE INDEX "books_audio_chapters_parent_id_idx" ON "payload"."books_audio_chapters" USING btree ("_parent_id");
  CREATE INDEX "books_audio_chapters_file_idx" ON "payload"."books_audio_chapters" USING btree ("file_id");
  CREATE INDEX "books_cover_idx" ON "payload"."books" USING btree ("cover_id");
  CREATE INDEX "books_sample_idx" ON "payload"."books" USING btree ("sample_id");
  CREATE INDEX "books_epub_idx" ON "payload"."books" USING btree ("epub_id");
  CREATE INDEX "books_pdf_idx" ON "payload"."books" USING btree ("pdf_id");
  CREATE UNIQUE INDEX "books_slug_idx" ON "payload"."books" USING btree ("slug");
  CREATE INDEX "books_updated_at_idx" ON "payload"."books" USING btree ("updated_at");
  CREATE INDEX "books_created_at_idx" ON "payload"."books" USING btree ("created_at");
  CREATE INDEX "books_texts_order_parent" ON "payload"."books_texts" USING btree ("order","parent_id");
  CREATE INDEX "books_rels_order_idx" ON "payload"."books_rels" USING btree ("order");
  CREATE INDEX "books_rels_parent_idx" ON "payload"."books_rels" USING btree ("parent_id");
  CREATE INDEX "books_rels_path_idx" ON "payload"."books_rels" USING btree ("path");
  CREATE INDEX "books_rels_authors_id_idx" ON "payload"."books_rels" USING btree ("authors_id");
  CREATE INDEX "authors_links_order_idx" ON "payload"."authors_links" USING btree ("_order");
  CREATE INDEX "authors_links_parent_id_idx" ON "payload"."authors_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "payload"."authors" USING btree ("slug");
  CREATE INDEX "authors_photo_idx" ON "payload"."authors" USING btree ("photo_id");
  CREATE INDEX "authors_updated_at_idx" ON "payload"."authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "payload"."authors" USING btree ("created_at");
  CREATE INDEX "illustrations_image_idx" ON "payload"."illustrations" USING btree ("image_id");
  CREATE INDEX "illustrations_book_idx" ON "payload"."illustrations" USING btree ("book_id");
  CREATE INDEX "illustrations_updated_at_idx" ON "payload"."illustrations" USING btree ("updated_at");
  CREATE INDEX "illustrations_created_at_idx" ON "payload"."illustrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "payload"."posts" USING btree ("slug");
  CREATE INDEX "posts_cover_idx" ON "payload"."posts" USING btree ("cover_id");
  CREATE INDEX "posts_updated_at_idx" ON "payload"."posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "payload"."posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "payload"."posts" USING btree ("_status");
  CREATE INDEX "_posts_v_parent_idx" ON "payload"."_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "payload"."_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_cover_idx" ON "payload"."_posts_v" USING btree ("version_cover_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "payload"."_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "payload"."_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "payload"."_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "payload"."_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "payload"."_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "payload"."_posts_v" USING btree ("latest");
  CREATE INDEX "orders_items_order_idx" ON "payload"."orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "payload"."orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_book_idx" ON "payload"."orders_items" USING btree ("book_id");
  CREATE INDEX "orders_user_idx" ON "payload"."orders" USING btree ("user_id");
  CREATE INDEX "orders_gateway_payment_id_idx" ON "payload"."orders" USING btree ("gateway_payment_id");
  CREATE INDEX "orders_updated_at_idx" ON "payload"."orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "payload"."orders" USING btree ("created_at");
  CREATE INDEX "entitlements_user_idx" ON "payload"."entitlements" USING btree ("user_id");
  CREATE INDEX "entitlements_book_idx" ON "payload"."entitlements" USING btree ("book_id");
  CREATE INDEX "entitlements_order_idx" ON "payload"."entitlements" USING btree ("order_id");
  CREATE INDEX "entitlements_updated_at_idx" ON "payload"."entitlements" USING btree ("updated_at");
  CREATE INDEX "entitlements_created_at_idx" ON "payload"."entitlements" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_book_idx" ON "payload"."entitlements" USING btree ("user_id","book_id");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "payload"."media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "payload"."media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_public_files_updated_at_idx" ON "payload"."media_public_files" USING btree ("updated_at");
  CREATE INDEX "media_public_files_created_at_idx" ON "payload"."media_public_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_public_files_filename_idx" ON "payload"."media_public_files" USING btree ("filename");
  CREATE INDEX "protected_files_updated_at_idx" ON "payload"."protected_files" USING btree ("updated_at");
  CREATE INDEX "protected_files_created_at_idx" ON "payload"."protected_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "protected_files_filename_idx" ON "payload"."protected_files" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_books_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("books_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_illustrations_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("illustrations_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_entitlements_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("entitlements_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_media_public_files_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_public_files_id");
  CREATE INDEX "payload_locked_documents_rels_protected_files_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("protected_files_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_shipping_rates_order_idx" ON "payload"."site_settings_shipping_rates" USING btree ("_order");
  CREATE INDEX "site_settings_shipping_rates_parent_id_idx" ON "payload"."site_settings_shipping_rates" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."books_audio_chapters" CASCADE;
  DROP TABLE "payload"."books" CASCADE;
  DROP TABLE "payload"."books_texts" CASCADE;
  DROP TABLE "payload"."books_rels" CASCADE;
  DROP TABLE "payload"."authors_links" CASCADE;
  DROP TABLE "payload"."authors" CASCADE;
  DROP TABLE "payload"."illustrations" CASCADE;
  DROP TABLE "payload"."posts" CASCADE;
  DROP TABLE "payload"."_posts_v" CASCADE;
  DROP TABLE "payload"."orders_items" CASCADE;
  DROP TABLE "payload"."orders" CASCADE;
  DROP TABLE "payload"."entitlements" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."media_public_files" CASCADE;
  DROP TABLE "payload"."protected_files" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."site_settings_shipping_rates" CASCADE;
  DROP TABLE "payload"."site_settings" CASCADE;
  DROP TYPE "payload"."enum_books_fulfillment";
  DROP TYPE "payload"."enum_books_status";
  DROP TYPE "payload"."enum_posts_status";
  DROP TYPE "payload"."enum__posts_v_version_status";
  DROP TYPE "payload"."enum_orders_items_format";
  DROP TYPE "payload"."enum_orders_status";
  DROP TYPE "payload"."enum_orders_currency";
  DROP TYPE "payload"."enum_orders_gateway";
  DROP TYPE "payload"."enum_orders_shipment_carrier";
  DROP TYPE "payload"."enum_protected_files_kind";
  DROP TYPE "payload"."enum_users_role";`)
}
