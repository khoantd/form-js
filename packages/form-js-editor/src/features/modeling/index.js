import commandModule from 'diagram-js/lib/command';

import { BehaviorModule } from './behavior';
import { FormLayoutUpdater } from './FormLayoutUpdater';
import { Modeling } from './Modeling';
import { SchemaUpdater } from './SchemaUpdater';

export const ModelingModule = {
  __depends__: [BehaviorModule, commandModule],
  __init__: ['formLayoutUpdater', 'schemaUpdater', 'modeling'],
  formLayoutUpdater: ['type', FormLayoutUpdater],
  schemaUpdater: ['type', SchemaUpdater],
  modeling: ['type', Modeling],
};
