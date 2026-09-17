import { z } from 'zod';
import { FieldType, FieldDefinition } from '@prisma/client';

export function buildDynamicSchema(fields: FieldDefinition[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny = z.any();

    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.TEXTAREA:
      case FieldType.ADDRESS:
      case FieldType.SELECT:
      case FieldType.RADIO:
      case FieldType.PHONE:
      case FieldType.FILE:
        schema = z.string();
        break;
      case FieldType.DATE:
      case FieldType.DATETIME:
        schema = z.string();
        break;
      case FieldType.NUMBER:
        schema = z.union([
          z.number(),
          z.string().regex(/^\d+$/, `${field.label} harus berupa angka`).transform(Number),
        ]);
        break;
      case FieldType.MULTISELECT:
      case FieldType.CHECKBOX:
        schema = z.array(z.string());
        break;
      case FieldType.NIK:
        schema = z.string().length(16, `${field.label} harus 16 digit`);
        break;
      case FieldType.EMAIL:
        schema = z.string().email(`${field.label} tidak valid`);
        break;
    }

    if (!field.required) {
      schema = schema.optional().nullable();
    } else {
      if (schema instanceof z.ZodString) {
        schema = schema.min(1, `${field.label} wajib diisi`);
      } else if (schema instanceof z.ZodArray) {
        schema = schema.min(1, `${field.label} wajib diisi minimal 1`);
      }
    }

    shape[field.key] = schema;
  }

  return z.object(shape).passthrough();
}
