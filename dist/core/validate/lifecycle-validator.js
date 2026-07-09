import { createDiagnostic } from '../diagnostics/warnings.ts';
export function validateLifecycle(features, context) {
    const errors = [];
    const warnings = [];
    const validStatuses = [
        'Draft', 'Specified', 'Planned', 'Tasks Ready',
        'Implemented', 'Verified', 'Approved', 'Closed', 'Open', 'Blocked',
        'Pending', 'Resolved', 'Defaulted', 'Rejected', 'Deferred', 'Complete', 'Incomplete'
    ];
    for (const f of features) {
        // Check unrecognized lifecycle status
        if (!validStatuses.includes(f.lifecycle)) {
            const diag = createDiagnostic({
                id: 'ERR_UNRECOGNIZED_LIFECYCLE',
                severity: context.strict ? 'error' : 'warning',
                category: 'lifecycle',
                message: `Feature ${f.number} has unrecognized lifecycle state: "${f.lifecycle}"`,
                source: { path: f.sourceLinks[0]?.path || '' }
            });
            if (context.strict)
                errors.push(diag);
            else
                warnings.push(diag);
        }
        // A feature is marked Verified without approval evidence (phase-exit approval)
        if (f.lifecycle === 'Verified' && f.approvalStatus !== 'APPROVED') {
            errors.push(createDiagnostic({
                id: 'ERR_VERIFIED_WITHOUT_APPROVAL',
                severity: 'error',
                category: 'lifecycle',
                message: `Feature ${f.number} is Verified but lacks approval evidence.`,
                source: { path: f.sourceLinks[0]?.path || '' }
            }));
        }
        // A feature is marked Verified but has no phase-exit.md
        if ((f.lifecycle === 'Verified' || f.lifecycle === 'Approved') && !f.phaseExitExists) {
            errors.push(createDiagnostic({
                id: 'ERR_VERIFIED_WITHOUT_PHASE_EXIT',
                severity: 'error',
                category: 'lifecycle',
                message: `Feature ${f.number} is ${f.lifecycle} but is missing its phase-exit.md.`,
                source: { path: f.sourceLinks[0]?.path || '' }
            }));
        }
        // A feature is Implemented but has no phase-exit.md when phase-exit is required (in governance/OAR B mode)
        if (f.lifecycle === 'Implemented' && !f.phaseExitExists &&
            (context.projectType === 'oarb-governance' || context.projectType === 'governance-speckit')) {
            errors.push(createDiagnostic({
                id: 'ERR_IMPLEMENTED_WITHOUT_PHASE_EXIT',
                severity: 'error',
                category: 'lifecycle',
                message: `Feature ${f.number} is Implemented but lacks required phase-exit.md.`,
                source: { path: f.sourceLinks[0]?.path || '' }
            }));
        }
        // Feature has tasks but no spec.md
        if (f.tasksExists && !f.specExists) {
            warnings.push(createDiagnostic({
                id: 'WARN_TASKS_WITHOUT_SPEC',
                severity: 'warning',
                category: 'lifecycle',
                message: `Feature ${f.number} has tasks.md but is missing spec.md.`,
                source: { path: f.sourceLinks.find(s => s.role === 'task-source')?.path || '' }
            }));
        }
        // Feature has plan.md but no tasks.md
        if (f.planExists && !f.tasksExists) {
            warnings.push(createDiagnostic({
                id: 'WARN_PLAN_WITHOUT_TASKS',
                severity: 'warning',
                category: 'lifecycle',
                message: `Feature ${f.number} has plan.md but is missing tasks.md.`,
                source: { path: f.sourceLinks.find(s => s.role === 'plan-source')?.path || '' }
            }));
        }
        // Inconsistent feature slug between path and content
        // Check if the title has the slug or matches
        if (f.slug && f.title && !f.title.toLowerCase().includes(f.slug.replace(/-/g, ' ').toLowerCase())) {
            // Just a mild warning for inconsistency
            warnings.push(createDiagnostic({
                id: 'WARN_INCONSISTENT_SLUG',
                severity: 'warning',
                category: 'lifecycle',
                message: `Inconsistent feature slug: directory is "${f.slug}" but title is "${f.title}".`,
                source: { path: f.sourceLinks[0]?.path || '' }
            }));
        }
    }
    // Active feature pointer points to missing directory
    const activeFeat = features.find(f => f.active);
    if (activeFeat === undefined && features.length > 0 && activeFeat !== undefined) {
        const diag = createDiagnostic({
            id: 'ERR_ACTIVE_FEATURE_MISSING',
            severity: context.strict ? 'error' : 'warning',
            category: 'lifecycle',
            message: `Active feature pointer references a feature that doesn't exist.`,
            source: { path: '.specify/feature.json' }
        });
        if (context.strict)
            errors.push(diag);
        else
            warnings.push(diag);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
