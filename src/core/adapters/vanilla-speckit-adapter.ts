import { Adapter, ParsedFragment, FeatureFragment, TaskFragment, ChecklistFragment } from './adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { parseMarkdownSections, flattenSections } from '../parsing/markdown-sections.ts';
import { parseMarkdownChecklist } from '../parsing/markdown-checklists.ts';
import { extractLinksAndIds } from '../parsing/links.ts';
import { Diagnostic, createDiagnostic } from '../diagnostics/warnings.ts';

export class VanillaSpecKitAdapter implements Adapter {
  id = 'vanilla-speckit';
  name = 'Vanilla SpecKit Adapter';

  canParse(artifact: Artifact): boolean {
    const roles: Artifact['role'][] = [
      'spec-source',
      'plan-source',
      'task-source',
      'checklist-source',
      'constitution-source',
      'active-feature-pointer',
      'supporting-artifact'
    ];
    return roles.includes(artifact.role);
  }

  parse(input: {
    artifact: Artifact;
    content: string;
    projectRoot: string;
    artifactIndex: Artifact[];
  }): ParsedFragment {
    const { artifact, content } = input;
    const diagnostics: Diagnostic[] = [];
    const entities: ParsedFragment['entities'] = {};

    const featureNumber = artifact.featureNumber;
    const featureSlug = artifact.featureSlug || '';

    if (artifact.role === 'active-feature-pointer') {
      // Parse .specify/feature.json
      try {
        const data = JSON.parse(content);
        const activeFeature: FeatureFragment = {
          featureNumber: data.number || data.id || 0,
          featureSlug: data.slug || '',
          active: true,
          title: data.title || ''
        };
        entities.features = [activeFeature];
      } catch (err) {
        diagnostics.push(
          createDiagnostic({
            id: 'ERR_INVALID_FEATURE_JSON',
            severity: 'error',
            category: 'parsing',
            message: `Failed to parse active feature pointer json: ${err instanceof Error ? err.message : String(err)}`,
            source: { path: artifact.relativePath }
          })
        );
      }
    } else if (artifact.role === 'spec-source') {
      // Parse spec.md
      const sections = parseMarkdownSections(content);
      const flatSections = flattenSections(sections);
      
      const title = sections[0]?.title || featureSlug || 'Untitled Feature';
      
      const userStories: string[] = [];
      const functionalRequirements: string[] = [];
      const acceptanceScenarios: string[] = [];
      const edgeCases: string[] = [];
      const assumptions: string[] = [];
      const clarifications: string[] = [];
      const unresolvedAmbiguities: string[] = [];

      // Extract details by matching sections
      for (const sec of flatSections) {
        const titleLower = sec.title.toLowerCase();
        
        // Extract bullet points from section content
        const bullets = sec.content
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.startsWith('-') || line.startsWith('*'))
          .map(line => line.substring(1).trim());

        if (titleLower.includes('story') || titleLower.includes('stories')) {
          userStories.push(...bullets);
        } else if (titleLower.includes('requirement')) {
          functionalRequirements.push(...bullets);
        } else if (titleLower.includes('acceptance') || titleLower.includes('scenario')) {
          acceptanceScenarios.push(...bullets);
        } else if (titleLower.includes('edge case')) {
          edgeCases.push(...bullets);
        } else if (titleLower.includes('assumption')) {
          assumptions.push(...bullets);
        } else if (titleLower.includes('clarification')) {
          clarifications.push(...bullets);
        }

        // Search content for unresolved terms
        const lines = sec.content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/\b(?:TODO|TBD|unresolved|ambiguity|ambiguous)\b/i.test(line)) {
            unresolvedAmbiguities.push(`${sec.title} (line ${sec.lineStart + i}): ${line.trim()}`);
          }
        }
      }

      // Also search whole file for FR-XXX and store it as functional requirement references
      const linksAndIds = extractLinksAndIds(content);
      for (const frId of linksAndIds.frIds) {
        if (!functionalRequirements.some(fr => fr.includes(frId))) {
          functionalRequirements.push(`Referenced requirement: ${frId}`);
        }
      }

      if (featureNumber !== undefined) {
        const feature: FeatureFragment = {
          featureNumber,
          featureSlug,
          title,
          userStories,
          functionalRequirements,
          acceptanceScenarios,
          edgeCases,
          assumptions,
          clarifications,
          unresolvedAmbiguities
        };
        entities.features = [feature];
      }
    } else if (artifact.role === 'task-source') {
      // Parse tasks.md
      const checklistItems = parseMarkdownChecklist(content);
      const tasks: TaskFragment[] = [];

      for (const item of checklistItems) {
        // Generate a task ID if not present
        const taskId = item.taskId || `T-${item.line}`;
        tasks.push({
          taskId,
          featureNumber,
          label: item.text,
          checked: item.checked,
          phase: item.phase,
          parallel: item.parallel,
          dependencies: item.decisionIds, // e.g. decision dependencies
          referencedFiles: item.referencedPaths,
          line: item.line
        });
      }

      entities.tasks = tasks;
    } else if (artifact.role === 'checklist-source') {
      // Parse checklists/*.md
      const checklistItems = parseMarkdownChecklist(content);
      const items = checklistItems.map(item => ({
        checked: item.checked,
        text: item.text,
        taskId: item.taskId,
        line: item.line
      }));

      const checklist: ChecklistFragment = {
        name: artifact.relativePath,
        featureNumber,
        items,
        lineStart: 1,
        lineEnd: content.split(/\r?\n/).length
      };

      entities.checklists = [checklist];
    } else if (artifact.role === 'constitution-source') {
      // Constitution source
      const checklistItems = parseMarkdownChecklist(content);
      const items = checklistItems.map(item => ({
        checked: item.checked,
        text: item.text,
        taskId: item.taskId,
        line: item.line
      }));

      const checklist: ChecklistFragment = {
        name: 'Constitution',
        featureNumber,
        items,
        lineStart: 1,
        lineEnd: content.split(/\r?\n/).length
      };

      entities.checklists = [checklist];
    }

    return {
      adapterId: this.id,
      artifactPath: artifact.relativePath,
      entities,
      diagnostics
    };
  }
}
