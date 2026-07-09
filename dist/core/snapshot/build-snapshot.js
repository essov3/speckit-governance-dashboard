import * as fs from 'fs';
import * as path from 'path';
import { discoverArtifacts } from '../discovery/discover-artifacts.ts';
import { createDiagnostic } from '../diagnostics/warnings.ts';
import { VanillaSpecKitAdapter } from '../adapters/vanilla-speckit-adapter.ts';
import { PhaseExitAdapter } from '../adapters/phase-exit-adapter.ts';
import { ContractAdapter } from '../adapters/contract-adapter.ts';
import { EvidenceAdapter } from '../adapters/evidence-adapter.ts';
import { GovernanceLedgerAdapter } from '../adapters/governance-ledger-adapter.ts';
import { CoverageMatrixAdapter } from '../adapters/coverage-matrix-adapter.ts';
import { DecisionRecordAdapter } from '../adapters/decision-record-adapter.ts';
import { OArbGovernanceAdapter } from '../adapters/oarb-governance-adapter.ts';
import { normalizeFeatures } from '../normalize/feature-normalizer.ts';
import { normalizeTasks } from '../normalize/task-normalizer.ts';
import { normalizeGates } from '../normalize/gate-normalizer.ts';
import { normalizeDecisions } from '../normalize/decision-normalizer.ts';
import { normalizeEvidenceHealth } from '../normalize/evidence-normalizer.ts';
import { normalizeCoverage } from '../normalize/coverage-normalizer.ts';
import { normalizeActivities } from '../normalize/activity-normalizer.ts';
import { validateLifecycle } from '../validate/lifecycle-validator.ts';
import { validateEvidence } from '../validate/evidence-validator.ts';
import { validateGates } from '../validate/gate-validator.ts';
import { validateDecisions } from '../validate/decision-validator.ts';
import { validateCoverage } from '../validate/coverage-validator.ts';
import { validateContracts } from '../validate/contract-validator.ts';
/**
 * Builds the project status snapshot.
 */
export async function buildSnapshot(options) {
    const { projectRoot, deterministic = false, strict = false, adapterMode = 'auto', includeUnknown = false } = options;
    // 1. Discover artifacts
    const artifacts = await discoverArtifacts({
        projectRoot,
        includeUnknown
    });
    // 2. Determine project type and adapters
    const hasLedger = artifacts.some(a => a.role === 'delivery-ledger');
    const hasCoverage = artifacts.some(a => a.role === 'coverage-matrix');
    const hasPhaseExit = artifacts.some(a => a.role === 'phase-exit-source');
    let detectedType = 'vanilla-speckit';
    if (adapterMode === 'oarb') {
        detectedType = 'oarb-governance';
    }
    else if (adapterMode === 'vanilla') {
        detectedType = 'vanilla-speckit';
    }
    else {
        // Auto detection
        if (hasLedger && hasCoverage) {
            detectedType = 'oarb-governance';
        }
        else if (hasLedger || hasPhaseExit) {
            detectedType = 'governance-speckit';
        }
    }
    // Instantiate adapters
    const adapters = [
        new VanillaSpecKitAdapter(),
        new PhaseExitAdapter(),
        new ContractAdapter(),
        new EvidenceAdapter(),
        new GovernanceLedgerAdapter(),
        new CoverageMatrixAdapter(),
        new DecisionRecordAdapter()
    ];
    if (detectedType === 'oarb-governance') {
        adapters.push(new OArbGovernanceAdapter());
    }
    const parsedFragments = [];
    const initialDiagnostics = [];
    // Parse each artifact
    for (const art of artifacts) {
        // Add artifact warnings (like WARN_UNKNOWN_ARTIFACT)
        initialDiagnostics.push(...art.warnings);
        const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip'].includes(art.extension.toLowerCase());
        let content = '';
        if (!isBinary) {
            try {
                content = fs.readFileSync(art.absolutePath, 'utf8');
            }
            catch (err) {
                initialDiagnostics.push(createDiagnostic({
                    id: 'ERR_FILE_READ_FAILED',
                    severity: 'error',
                    category: 'parsing',
                    message: `Failed to read file content: ${err instanceof Error ? err.message : String(err)}`,
                    source: { path: art.relativePath }
                }));
                continue;
            }
        }
        for (const adapter of adapters) {
            if (adapter.canParse(art)) {
                try {
                    const fragment = adapter.parse({
                        artifact: art,
                        content,
                        projectRoot,
                        artifactIndex: artifacts
                    });
                    parsedFragments.push(fragment);
                    initialDiagnostics.push(...fragment.diagnostics);
                }
                catch (err) {
                    initialDiagnostics.push(createDiagnostic({
                        id: 'ERR_ADAPTER_CRASH',
                        severity: 'error',
                        category: 'parsing',
                        message: `Adapter "${adapter.name}" crashed on file "${art.relativePath}": ${err instanceof Error ? err.message : String(err)}`,
                        source: { path: art.relativePath }
                    }));
                }
            }
        }
    }
    // 3. Extract and merge fragments
    const featuresList = [];
    const tasksList = [];
    const gatesList = [];
    const decisionsList = [];
    const coverageList = [];
    const evidenceList = [];
    const contractsList = [];
    const activitiesList = [];
    const risksList = [];
    const taskPathMap = new Map(); // featureNum -> tasks file relative path
    const decisionPathMap = new Map(); // decisionId -> file relative path
    const activityPathMap = new Map(); // key -> file relative path
    for (const frag of parsedFragments) {
        const p = frag.artifactPath;
        if (frag.entities.features)
            featuresList.push(...frag.entities.features);
        if (frag.entities.tasks) {
            tasksList.push(...frag.entities.tasks);
            for (const t of frag.entities.tasks) {
                if (t.featureNumber) {
                    taskPathMap.set(String(t.featureNumber), p);
                }
            }
        }
        if (frag.entities.gates)
            gatesList.push(...frag.entities.gates);
        if (frag.entities.decisions) {
            decisionsList.push(...frag.entities.decisions);
            for (const d of frag.entities.decisions) {
                decisionPathMap.set(d.decisionId, p);
            }
        }
        if (frag.entities.coverageRows)
            coverageList.push(...frag.entities.coverageRows);
        if (frag.entities.evidenceItems)
            evidenceList.push(...frag.entities.evidenceItems);
        if (frag.entities.contracts)
            contractsList.push(...frag.entities.contracts);
        if (frag.entities.activities) {
            activitiesList.push(...frag.entities.activities);
            for (const a of frag.entities.activities) {
                const key = `${a.event}-${a.featureNumber}-${a.gateId}-${a.decisionId}`;
                activityPathMap.set(key, p);
            }
        }
        if (frag.entities.risks)
            risksList.push(...frag.entities.risks);
    }
    // 4. Normalize lists
    // Find active feature number if pointer exists
    const activeFeaturePointer = featuresList.find(f => f.active);
    const activeFeatureNum = activeFeaturePointer?.featureNumber;
    const features = normalizeFeatures({
        artifacts,
        parsedFeatures: featuresList,
        parsedTasks: tasksList,
        parsedEvidence: evidenceList,
        parsedContracts: contractsList,
        activeFeatureNum
    });
    const tasks = normalizeTasks(tasksList, taskPathMap);
    const ledgerArt = artifacts.find(a => a.role === 'delivery-ledger');
    const ledgerPath = ledgerArt?.relativePath || '';
    const gates = normalizeGates(gatesList, ledgerPath);
    const decisions = normalizeDecisions(decisionsList, decisionPathMap);
    const evidenceHealth = normalizeEvidenceHealth({
        features: features.map(f => ({ number: f.number, slug: f.slug })),
        parsedEvidence: evidenceList,
        artifacts
    });
    const matrixArt = artifacts.find(a => a.role === 'coverage-matrix');
    const matrixPath = matrixArt?.relativePath || '';
    const coverage = normalizeCoverage(coverageList, matrixPath);
    const activityFeed = normalizeActivities(activitiesList, activityPathMap);
    // Determine if ENGINE_COMPLETE declared
    let engineCompleteDeclared = false;
    let engineCompleteSourceValue = undefined;
    const ledgerContentFrag = parsedFragments.find(f => f.artifactPath === ledgerPath);
    if (ledgerContentFrag) {
        const isDeclared = activitiesList.some(a => a.event === 'Lifecycle State Declared' && a.notes?.includes('ENGINE_COMPLETE'));
        if (isDeclared) {
            engineCompleteDeclared = true;
            engineCompleteSourceValue = {
                value: true,
                source: { path: ledgerPath, lineStart: 1 },
                confidence: 'high',
                role: 'canonical-state',
                diagnostics: []
            };
        }
    }
    // 5. Validation Context
    const context = {
        projectType: detectedType,
        strict,
        projectRoot
    };
    // Run validators
    const contractPaths = contractsList.map(c => c.filePath);
    const valLifecycle = validateLifecycle(features, context);
    const valEvidence = validateEvidence(features, tasks, evidenceHealth, context);
    const valGates = validateGates(gates, features, engineCompleteDeclared, context);
    const valDecisions = validateDecisions(decisions, gates, context);
    const valCoverage = validateCoverage(coverage, contractPaths, context);
    const valContracts = validateContracts(contractsList, tasks, context);
    // Combine diagnostics
    const allErrors = [
        ...initialDiagnostics.filter(d => d.severity === 'error'),
        ...valLifecycle.errors,
        ...valEvidence.errors,
        ...valGates.errors,
        ...valDecisions.errors,
        ...valCoverage.errors,
        ...valContracts.errors
    ];
    const allWarnings = [
        ...initialDiagnostics.filter(d => d.severity === 'warning'),
        ...valLifecycle.warnings,
        ...valEvidence.warnings,
        ...valGates.warnings,
        ...valDecisions.warnings,
        ...valCoverage.warnings,
        ...valContracts.warnings
    ];
    // Collect risks and blockers from validators and parsed risks
    const risksAndBlockers = [];
    for (const err of allErrors) {
        risksAndBlockers.push({
            id: err.id,
            severity: 'error',
            type: 'blocker',
            message: err.message,
            source: err.source
        });
    }
    for (const warn of allWarnings) {
        risksAndBlockers.push({
            id: warn.id,
            severity: 'warning',
            type: 'risk',
            message: warn.message,
            source: warn.source
        });
    }
    for (const r of risksList) {
        risksAndBlockers.push({
            id: 'RISK_PARSED',
            severity: r.severity,
            type: r.type,
            message: r.message,
            featureNumber: r.featureNumber,
            source: { path: ledgerPath, lineStart: r.lineStart }
        });
    }
    // Executive overview calculations
    const totalFeatures = features.length;
    const verifiedFeatures = features.filter(f => f.lifecycle === 'Verified' || f.lifecycle === 'Approved').length;
    const implementedFeatures = features.filter(f => f.lifecycle === 'Implemented').length;
    const incompleteFeatures = totalFeatures - verifiedFeatures - implementedFeatures;
    const highestSeverity = allErrors.length > 0 ? 'error' : allWarnings.length > 0 ? 'warning' : 'none';
    const snapshotDiagnostics = [...allErrors, ...allWarnings];
    // Sort diagnostics by severity, category, source path, message
    snapshotDiagnostics.sort((a, b) => {
        const sevOrder = { error: 0, warning: 1, info: 2 };
        const aSev = sevOrder[a.severity];
        const bSev = sevOrder[b.severity];
        if (aSev !== bSev)
            return aSev - bSev;
        const catCompare = a.category.localeCompare(b.category);
        if (catCompare !== 0)
            return catCompare;
        const aPath = a.source?.path || '';
        const bPath = b.source?.path || '';
        const pathCompare = aPath.localeCompare(bPath);
        if (pathCompare !== 0)
            return pathCompare;
        return a.message.localeCompare(b.message);
    });
    // Constitution checks summary
    let constitutionSummary = undefined;
    const constitutionArt = artifacts.find(a => a.role === 'constitution-source');
    if (constitutionArt) {
        const constFragment = parsedFragments.find(f => f.artifactPath === constitutionArt.relativePath);
        const constChecklist = constFragment?.entities.checklists?.[0];
        if (constChecklist) {
            const checksCount = constChecklist.items.length;
            const passedChecksCount = constChecklist.items.filter(i => i.checked).length;
            constitutionSummary = {
                path: constitutionArt.relativePath,
                checksCount,
                passedChecksCount
            };
        }
    }
    const generatedAt = deterministic ? 'deterministic' : new Date().toISOString();
    // Create ProjectStatusSnapshot object
    const snapshot = {
        schemaVersion: 1,
        generated: {
            generatedAt,
            deterministic,
            generatorVersion: '1.0.0',
            projectRoot,
            command: options.cliCommand || 'build-snapshot',
            sourceOfTruth: 'markdown',
            snapshotRole: 'derived-cache'
        },
        project: {
            name: path.basename(projectRoot),
            detectedType,
            activeFeature: activeFeaturePointer ? {
                number: activeFeaturePointer.featureNumber,
                slug: activeFeaturePointer.featureSlug,
                title: activeFeaturePointer.title
            } : undefined,
            constitution: constitutionSummary
        },
        artifacts: artifacts.map(a => ({
            path: a.relativePath,
            hash: a.hash,
            role: a.role,
            featureNumber: a.featureNumber,
            sizeBytes: a.sizeBytes
        })),
        executive: {
            programLifecycle: ledgerArt ? {
                value: detectedType === 'oarb-governance' ? 'ACTIVE' : 'NONE',
                source: { path: ledgerPath, lineStart: 1 },
                confidence: 'medium',
                role: 'canonical-state',
                diagnostics: []
            } : undefined,
            readinessStates: [],
            engineCompleteDeclared: engineCompleteSourceValue,
            gateSummary: gates.map(g => ({ gateId: g.gateId, status: g.status })),
            featureSummary: {
                total: totalFeatures,
                verified: verifiedFeatures,
                implemented: implementedFeatures,
                incomplete: incompleteFeatures
            },
            lastUpdatedArtifact: artifacts.length > 0 ? {
                path: artifacts[0].relativePath, // Already sorted alphabetically, but let's keep it deterministic
                role: artifacts[0].role
            } : undefined,
            highestSeverity,
            warnings: snapshotDiagnostics
        },
        gates,
        features,
        coverage,
        decisions,
        evidenceHealth,
        risksAndBlockers,
        activityFeed,
        diagnostics: snapshotDiagnostics,
        validation: {
            status: allErrors.length > 0 ? 'fail' : allWarnings.length > 0 ? 'warn' : 'pass',
            errors: allErrors,
            warnings: allWarnings
        }
    };
    return snapshot;
}
