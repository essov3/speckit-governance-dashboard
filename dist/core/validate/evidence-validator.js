import * as path from 'path';
import { createDiagnostic } from '../diagnostics/warnings.ts';
import { resolveReferencedPath } from '../parsing/links.ts';
export function validateEvidence(features, tasks, evidenceHealths, context) {
    const errors = [];
    const warnings = [];
    for (const eh of evidenceHealths) {
        const feat = features.find(f => f.number === eh.featureNumber);
        if (!feat)
            continue;
        const featureDir = path.resolve(context.projectRoot, 'specs', `${String(eh.featureNumber).padStart(3, '0')}-${eh.featureSlug}`);
        // Check if phase-exit.md exists but lacks product:doctor or OpenAPI audit references
        if (eh.phaseExitExists) {
            if (!eh.productDoctorNotesExists) {
                warnings.push(createDiagnostic({
                    id: 'WARN_MISSING_DOCTOR_AUDIT',
                    severity: 'warning',
                    category: 'evidence',
                    message: `Feature ${eh.featureNumber} phase-exit.md exists but does not mention Product Doctor audit.`,
                    source: eh.source
                }));
            }
            if (!eh.openApiNotesExists) {
                warnings.push(createDiagnostic({
                    id: 'WARN_MISSING_OPENAPI_AUDIT',
                    severity: 'warning',
                    category: 'evidence',
                    message: `Feature ${eh.featureNumber} phase-exit.md exists but does not mention OpenAPI audit.`,
                    source: eh.source
                }));
            }
        }
        // Check tasks for this feature that claim completion or reference files
        const featTasks = tasks.filter(t => t.featureNumber === eh.featureNumber);
        for (const t of featTasks) {
            if (t.referencedFiles && t.referencedFiles.length > 0) {
                for (const fileRef of t.referencedFiles) {
                    const resolved = resolveReferencedPath({
                        referencedPath: fileRef,
                        artifactPath: path.resolve(context.projectRoot, t.source.path),
                        projectRoot: context.projectRoot,
                        featureDir
                    });
                    if (!resolved) {
                        // Missing evidence file!
                        const msg = `Task ${t.taskId} in feature ${eh.featureNumber} references missing evidence/artifact file: "${fileRef}"`;
                        const diag = createDiagnostic({
                            id: 'ERR_MISSING_REFERENCED_EVIDENCE',
                            severity: context.strict ? 'error' : 'warning',
                            category: 'evidence',
                            message: msg,
                            source: { path: t.source.path, lineStart: t.source.line }
                        });
                        if (context.strict) {
                            errors.push(diag);
                        }
                        else {
                            warnings.push(diag);
                        }
                        eh.missingReferencedEvidence.push(fileRef);
                    }
                }
            }
            // Check tasks claiming completion but no evidence found where references are expected
            if (t.checked && (!t.referencedFiles || t.referencedFiles.length === 0)) {
                // If it's a verification or review task, warn that no evidence was linked
                if (/verify|test|check|review|approve/i.test(t.label)) {
                    warnings.push(createDiagnostic({
                        id: 'WARN_VERIFICATION_WITHOUT_EVIDENCE_LINK',
                        severity: 'warning',
                        category: 'evidence',
                        message: `Task ${t.taskId} ("${t.label}") is completed but has no referenced evidence file.`,
                        source: { path: t.source.path, lineStart: t.source.line }
                    }));
                }
            }
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
