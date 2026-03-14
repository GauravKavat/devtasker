import { z } from "zod";

const nullableString = z.union([z.string().trim().min(1), z.null()]);

const taskUpdateObjectSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: nullableString.optional(),
  assignee_id: nullableString.optional(),
  start_date: nullableString.optional(),
  end_date: nullableString.optional(),
  column_id: z.string().trim().min(1).optional(),
  position: z.number().int().nonnegative().optional(),
});

export const taskUpdateFieldsSchema = taskUpdateObjectSchema
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one task field must be provided",
  });

const bulkTaskUpdateSchema = taskUpdateObjectSchema
  .extend({
    id: z.string().trim().min(1),
  })
  .strict()
  .refine((value) => Object.keys(value).some((key) => key !== "id"), {
    message: "At least one task field must be provided",
  });

export const bulkTaskUpdatesSchema = z
  .object({
    updates: z
      .array(bulkTaskUpdateSchema)
      .min(1, "At least one task update is required"),
  })
  .strict();

export type TaskUpdateFields = z.infer<typeof taskUpdateFieldsSchema>;
export type BulkTaskUpdate = z.infer<typeof bulkTaskUpdateSchema>;

export function parseTaskUpdate(input: unknown): TaskUpdateFields {
  return taskUpdateFieldsSchema.parse(input);
}

export function parseBulkTaskUpdates(
  input: unknown,
): z.infer<typeof bulkTaskUpdatesSchema>["updates"] {
  return bulkTaskUpdatesSchema.parse(input).updates;
}
