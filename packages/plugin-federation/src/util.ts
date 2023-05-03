import { GraphQLResolveInfo } from 'graphql';
import { Selection } from './types';

type DirectiveList = { name: string; args?: {} }[];
type DirectiveOption = DirectiveList | Record<string, {}>;

export function keyDirective(key: Selection<object> | Selection<object>[]): {
  name: string;
  args?: {};
}[] {
  if (Array.isArray(key)) {
    return key.map(({ selection }) => ({
      name: 'key',
      args: { fields: selection },
    }));
  }

  return [
    {
      name: 'key',
      args: { fields: key.selection },
    },
  ];
}

export function mergeDirectives(
  existing: DirectiveOption | undefined,
  add: DirectiveList,
): DirectiveList {
  if (!existing) {
    return [...add];
  }

  if (Array.isArray(existing)) {
    return [...existing, ...add];
  }

  return [...Object.keys(existing).map((name) => ({ name, args: existing[name] })), ...add];
}

export const entityMapping = new WeakMap<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PothosSchemaTypes.SchemaBuilder<any>,
  Map<
    string,
    {
      key: Selection<object> | Selection<object>[];
      interfaceObject?: boolean;
      resolveReference: (val: object, context: {}, info: GraphQLResolveInfo) => unknown;
    }
  >
>();
