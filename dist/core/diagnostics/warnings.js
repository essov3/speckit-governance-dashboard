export function createDiagnostic(params) {
    return {
        id: params.id,
        severity: params.severity,
        category: params.category,
        message: params.message,
        source: params.source,
        relatedSources: params.relatedSources,
        suggestedAction: params.suggestedAction,
    };
}
