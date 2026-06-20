import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  college: text('college').notNull(),
  studentNo: text('student_no').notNull().unique(),
  gender: text('gender'),
  studyPeriod: text('study_period'),
  signedCount: integer('signed_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const signatures = pgTable('signatures', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  name: text('name').notNull(),
  college: text('college'),
  studentNo: text('student_no'),
  signatureImage: text('signature_image').notNull(),
  deviceLabel: text('device_label'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const appConfig = pgTable('app_config', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Student = typeof students.$inferSelect
export type Signature = typeof signatures.$inferSelect
export type AppConfig = typeof appConfig.$inferSelect
