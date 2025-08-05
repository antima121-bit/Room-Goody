import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rooms table for storing scanned room layouts
export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  layoutImageUri: text("layout_image_uri"),
  planData: jsonb("plan_data"), // MagicPlan data
  furniture: jsonb("furniture").default([]), // Array of furniture markers
  gpsLocation: jsonb("gps_location"), // GPS coordinates
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  syncStatus: varchar("sync_status").default('pending'), // 'synced' | 'pending' | 'failed'
});

// Detected objects table for ML detection results
export const detectedObjects = pgTable("detected_objects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  imageUri: text("image_uri").notNull(),
  objects: jsonb("objects").notNull(), // Array of detected objects
  mlMetadata: jsonb("ml_metadata").notNull(), // ML processing metadata
  gpsLocation: jsonb("gps_location").notNull(), // GPS coordinates
  colors: jsonb("colors").notNull(), // Extracted color palette
  shapes: jsonb("shapes").notNull(), // Detected shapes
  roomId: varchar("room_id").references(() => rooms.id), // Optional room association
  createdAt: timestamp("created_at").defaultNow(),
  syncStatus: varchar("sync_status").default('pending'),
});

// Search cache table for performance optimization
export const searchCache = pgTable("search_cache", {
  queryHash: varchar("query_hash").primaryKey(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDetectedObjectSchema = createInsertSchema(detectedObjects).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertDetectedObject = z.infer<typeof insertDetectedObjectSchema>;
export type DetectedObject = typeof detectedObjects.$inferSelect;

// Additional type definitions for the application
export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface MLObject {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  category: string;
  subcategory?: string;
  brand?: string;
  estimatedSize?: 'small' | 'medium' | 'large';
}

export interface ColorPalette {
  dominant: string;
  palette: string[];
  names: string[];
}

export interface DetectedShape {
  type: 'rectangle' | 'circle' | 'triangle' | 'irregular';
  confidence: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface SearchCriteria {
  textQuery?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  color?: string[];
  shape?: string;
  size?: 'small' | 'medium' | 'large';
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  confidence?: number;
  roomId?: string;
}
