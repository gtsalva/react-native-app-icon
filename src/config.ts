import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'culori';

const cssColor = z.string().min(1).refine(
  (v) => parse(v) !== undefined,
  { message: 'Must be a valid CSS color (hex, rgb, hsl, lab, oklch, etc.)' }
);

const BackgroundSchema = z.object({
  type: z.enum(['solid', 'gradient', 'transparent']),
  color: cssColor.optional(),
  gradient: z.object({
    type: z.enum(['linear', 'radial']),
    angle: z.number().min(0).max(360).optional(),
    stops: z.array(z.object({
      color: cssColor,
      position: z.number().min(0).max(1),
    })).min(2),
  }).optional(),
}).refine(
  (bg) => bg.type !== 'solid' || !!bg.color,
  { message: 'color is required when type is "solid"' }
).refine(
  (bg) => bg.type !== 'gradient' || !!bg.gradient,
  { message: 'gradient is required when type is "gradient"' }
);

const TransformSchema = z.object({
  padding: z.number().min(0).max(0.5).default(0.1),
  borderRadius: z.number().min(0).max(1).default(0),
  rotate: z.number().min(-360).max(360).default(0),
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
  scale: z.number().min(0.1).max(2).default(1.0),
});

const AndroidSchema = z.object({
  appSlug: z.string().min(1).optional(),
  format: z.enum(['png', 'webp']).default('png'),
  round: z.boolean().default(false),
  adaptiveIcon: z.object({
    background: BackgroundSchema,
    foreground: z.object({
      padding: z.number().min(0).max(0.5).default(0.25),
      image: z.string().nullable().default(null),
    }),
  }).optional(),
}).optional();

const IosSchema = z.object({}).optional();

export const DoiconConfigSchema = z.object({
  $schema: z.string().optional(),
  source: z.string().min(1),
  background: BackgroundSchema.optional(),
  transform: TransformSchema.default({}),
  android: AndroidSchema,
  ios: IosSchema,
});

export type DoiconConfig = z.infer<typeof DoiconConfigSchema>;
export type Background = z.infer<typeof BackgroundSchema>;
export type Transform = z.infer<typeof TransformSchema>;

const CONFIG_FILENAMES = ['doicon.config.json', 'doicon.json'];

export function loadConfig(configPath?: string): DoiconConfig {
  let resolvedPath: string;

  if (configPath) {
    resolvedPath = path.resolve(configPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Config file not found: ${resolvedPath}`);
    }
  } else {
    const found = CONFIG_FILENAMES.map(f => path.resolve(process.cwd(), f)).find(fs.existsSync);
    if (!found) {
      throw new Error(`No config file found. Create a doicon.config.json in your project root.`);
    }
    resolvedPath = found;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  } catch {
    throw new Error(`Failed to parse config file: ${resolvedPath}`);
  }

  const result = DoiconConfigSchema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid doicon config:\n${messages}`);
  }

  const configDir = path.dirname(resolvedPath);
  result.data.source = path.resolve(configDir, result.data.source);

  if (!fs.existsSync(result.data.source)) {
    throw new Error(`Source image not found: ${result.data.source}`);
  }

  return result.data;
}
