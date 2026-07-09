import { z } from 'zod';
export const DiagnosticSeveritySchema = z.enum(['info', 'warning', 'error']);
export const DiagnosticCategorySchema = z.enum([
    'discovery',
    'parsing',
    'lifecycle',
    'gate',
    'decision',
    'coverage',
    'evidence',
    'contract',
    'snapshot',
    'staleness',
    'read-only'
]);
export const SourceLocationSchema = z.object({
    path: z.string(),
    lineStart: z.number().optional(),
    lineEnd: z.number().optional(),
    excerpt: z.string().optional()
});
export const DiagnosticSchema = z.object({
    id: z.string(),
    severity: DiagnosticSeveritySchema,
    category: DiagnosticCategorySchema,
    message: z.string(),
    source: SourceLocationSchema.optional(),
    relatedSources: z.array(SourceLocationSchema).optional(),
    suggestedAction: z.string().optional()
});
export const SourceValueSchema = z.object({
    value: z.any(),
    source: SourceLocationSchema,
    confidence: z.enum(['high', 'medium', 'low']),
    role: z.enum([
        'canonical-state',
        'specification',
        'planning',
        'task-claim',
        'checklist',
        'supporting-evidence',
        'contract',
        'derived'
    ]),
    diagnostics: z.array(DiagnosticSchema)
});
export const ArtifactSummarySchema = z.object({
    path: z.string(),
    hash: z.string(),
    role: z.string(),
    featureNumber: z.number().optional(),
    sizeBytes: z.number()
});
export const ActiveFeatureSchema = z.object({
    number: z.number(),
    slug: z.string(),
    title: z.string().optional()
});
export const ConstitutionSummarySchema = z.object({
    path: z.string(),
    checksCount: z.number(),
    passedChecksCount: z.number()
});
export const GateSummarySchema = z.object({
    gateId: z.string(),
    status: z.string()
});
export const FeatureSummarySchema = z.object({
    total: z.number(),
    verified: z.number(),
    implemented: z.number(),
    incomplete: z.number()
});
export const ArtifactReferenceSchema = z.object({
    path: z.string(),
    role: z.string(),
    lastModified: z.string().optional()
});
export const ProjectStatusSnapshotSchema = z.object({
    schemaVersion: z.literal(1),
    generated: z.object({
        generatedAt: z.string(),
        deterministic: z.boolean(),
        generatorVersion: z.string(),
        projectRoot: z.string(),
        projectRootHash: z.string().optional(),
        command: z.string(),
        sourceOfTruth: z.literal('markdown'),
        snapshotRole: z.literal('derived-cache')
    }),
    project: z.object({
        name: z.string(),
        detectedType: z.enum(['vanilla-speckit', 'governance-speckit', 'oarb-governance', 'unknown']),
        activeFeature: ActiveFeatureSchema.optional(),
        constitution: ConstitutionSummarySchema.optional()
    }),
    artifacts: z.array(ArtifactSummarySchema),
    executive: z.object({
        programLifecycle: SourceValueSchema.optional(),
        readinessStates: z.array(SourceValueSchema),
        engineCompleteDeclared: SourceValueSchema.optional(),
        gateSummary: z.array(GateSummarySchema),
        featureSummary: FeatureSummarySchema,
        lastUpdatedArtifact: ArtifactReferenceSchema.optional(),
        highestSeverity: z.enum(['none', 'info', 'warning', 'error']),
        warnings: z.array(DiagnosticSchema)
    }),
    gates: z.array(z.any()),
    features: z.array(z.any()),
    coverage: z.array(z.any()),
    decisions: z.array(z.any()),
    evidenceHealth: z.array(z.any()),
    risksAndBlockers: z.array(z.any()),
    activityFeed: z.array(z.any()),
    diagnostics: z.array(DiagnosticSchema),
    validation: z.object({
        status: z.enum(['pass', 'warn', 'fail']),
        errors: z.array(DiagnosticSchema),
        warnings: z.array(DiagnosticSchema)
    })
});
