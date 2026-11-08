import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const item = z.object({ id: z.string(), title: z.string(), text: z.string() });
const pages = defineCollection({
  // Home v2 is parsed as safe Scene data, never evaluated as JSX by Astro MDX.
  loader: glob({ pattern: ['**/*.mdx', '!**/people.mdx'], base: './content/pages' }),
  schema: z.object({
    schemaVersion: z.literal(1),
    id: z.string(),
    locale: z.string(),
    route: z.string(),
    audience: z.enum(['people', 'professionals', 'all']),
    status: z.enum(['draft', 'in_review', 'approved', 'archived']),
    revision: z.number(),
    review: z.object({ commercial: z.string(), clinical: z.string(), legal: z.string() }),
    agentEligible: z.boolean(),
    sourceIds: z.array(z.string()),
    seo: z.object({ title: z.string(), description: z.string() }),
    sections: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        text: z.string().optional(),
        items: z.array(item).optional(),
        actions: z.array(z.string()).optional(),
        noticeKey: z.string().optional(),
      }),
    ),
  }),
});

export const collections = { pages };
