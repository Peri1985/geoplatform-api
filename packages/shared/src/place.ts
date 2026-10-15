import { z } from 'zod';

export const PointSchema = z.object({
  type: z.literal('Point'),
  // GeoJSON order: [longitude, latitude]
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});
export type Point = z.infer<typeof PointSchema>;

export const PlaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  location: PointSchema,
  createdAt: z.coerce.date(),
});
export type Place = z.infer<typeof PlaceSchema>;

export const CreatePlaceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  location: PointSchema,
});
export type CreatePlace = z.infer<typeof CreatePlaceSchema>;

export const NearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(100_000).default(1000),
});
export type NearbyQuery = z.infer<typeof NearbyQuerySchema>;
