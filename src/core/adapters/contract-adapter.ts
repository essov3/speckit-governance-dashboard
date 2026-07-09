import * as path from 'path';
import { Adapter, ParsedFragment, ContractFragment } from './adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { extractLinksAndIds } from '../parsing/links.ts';
import { Diagnostic } from '../diagnostics/warnings.ts';

export class ContractAdapter implements Adapter {
  id = 'contract';
  name = 'Contracts Adapter';

  canParse(artifact: Artifact): boolean {
    return artifact.role === 'contract';
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
    const lowercasePath = artifact.relativePath.toLowerCase();
    const lowercaseFilename = path.basename(lowercasePath);
    
    let contractType: ContractFragment['contractType'] = 'unknown';
    const endpoints: string[] = [];
    const events: string[] = [];
    const schemas: string[] = [];

    // 1. Classify contract type
    if (
      lowercaseFilename.includes('openapi') ||
      lowercasePath.includes('/openapi/') ||
      content.includes('openapi:') ||
      content.includes('"openapi"')
    ) {
      contractType = 'openapi';
    } else if (lowercasePath.includes('/events/') || lowercaseFilename.includes('event')) {
      contractType = 'event-contract';
    } else if (lowercasePath.includes('/messages/') || lowercaseFilename.includes('message')) {
      contractType = 'message-contract';
    } else if (lowercasePath.includes('/routes/') || lowercaseFilename.includes('route') || lowercaseFilename.includes('ui')) {
      contractType = 'ui-route-contract';
    } else if (lowercasePath.includes('/schemas/') || lowercaseFilename.includes('schema')) {
      contractType = 'schema-contract';
    } else {
      contractType = 'rest-contract';
    }

    // 2. Extract endpoints, events, and schemas using regex
    // Endpoints (looks like "/api/v1/users" or similar paths)
    const endpointRegex = /"(\/[a-zA-Z0-9_\-\{\}\/]+)"|'(\/[a-zA-Z0-9_\-\{\}\/]+)'|^  (\/[a-zA-Z0-9_\-\{\}\/]+):/gm;
    let endMatch;
    while ((endMatch = endpointRegex.exec(content)) !== null) {
      const endpoint = endMatch[1] || endMatch[2] || endMatch[3];
      // Avoid simple strings like '/' or double slash, and only take paths with letters
      if (endpoint && endpoint.length > 2 && /[a-zA-Z]/.test(endpoint) && !endpoints.includes(endpoint)) {
        endpoints.push(endpoint);
      }
    }

    // Schema Names
    // Matches keys under components/schemas in yaml, or definitions in json
    const schemaRegex = /(?:schemas|definitions):\s*\r?\n(\s+)([a-zA-Z0-9_-]+):/g;
    let schemaMatch;
    while ((schemaMatch = schemaRegex.exec(content)) !== null) {
      const schemaName = schemaMatch[2];
      if (!schemas.includes(schemaName)) {
        schemas.push(schemaName);
      }
    }

    // Event Names
    const eventRegex = /(?:eventName|event_name|event):\s*['"]?([a-zA-Z0-9_\.-]+)['"]?/gi;
    let eventMatch;
    while ((eventMatch = eventRegex.exec(content)) !== null) {
      const eventName = eventMatch[1];
      if (!events.includes(eventName)) {
        events.push(eventName);
      }
    }

    // 3. Extract links, FR IDs, and task IDs from content
    const linksAndIds = extractLinksAndIds(content);

    const contract: ContractFragment = {
      filePath: artifact.relativePath,
      featureNumber,
      contractType,
      endpoints: endpoints.slice(0, 15), // Cap at 15 to keep snapshot size reasonable
      events: events.slice(0, 15),
      schemas: schemas.slice(0, 15),
      referencedFrIds: linksAndIds.frIds,
      referencedTaskIds: linksAndIds.taskIds,
      referencedEvidence: linksAndIds.filePaths
    };

    entities.contracts = [contract];

    return {
      adapterId: this.id,
      artifactPath: artifact.relativePath,
      entities,
      diagnostics
    };
  }
}
