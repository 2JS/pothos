import { GraphQLFieldResolver, GraphQLResolveInfo, print } from 'graphql';
import { pathToString, runFunction } from '@pothos/plugin-tracing';
import * as Sentry from '@sentry/node';
import { AttributeNames } from './enums';

export * from './enums';

interface SentryWrapperOptions<T> {
  ignoreError?: boolean;
  includeArgs?: boolean;
  includeSource?: boolean;
  onSpan?: (
    span: Sentry.Span,
    options: T,
    parent: unknown,
    args: {},
    context: object,
    info: GraphQLResolveInfo,
  ) => void;
}

export function createSentryWrapper<T = unknown>(options?: SentryWrapperOptions<T>) {
  return <Context extends object = object>(
      resolver: GraphQLFieldResolver<unknown, Context, Record<string, unknown>>,
      fieldOptions: T,
      tracingOptions?: SentryWrapperOptions<T>,
    ): GraphQLFieldResolver<unknown, Context, Record<string, unknown>> =>
    (source, args, ctx, info) => {
      const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();

      if (!transaction) {
        return resolver(source, args, ctx, info);
      }

      const tags = {
        [AttributeNames.FIELD_NAME]: info.fieldName,
        [AttributeNames.FIELD_PATH]: pathToString(info),
        [AttributeNames.FIELD_TYPE]: info.returnType.toString(),
      };

      const data: Record<string, unknown> = {};

      if (tracingOptions?.includeArgs ?? options?.includeArgs) {
        data[AttributeNames.FIELD_ARGS] = args;
      }

      if (tracingOptions?.includeSource ?? options?.includeSource) {
        data[AttributeNames.SOURCE] = print(info.fieldNodes[0]);
      }

      const span = transaction.startChild({
        op: 'graphql.resolve',
        description: info.fieldName,
        tags,
        data,
      });

      tracingOptions?.onSpan?.(span, fieldOptions, source, args, ctx, info);
      options?.onSpan?.(span, fieldOptions, source, args, ctx, info);

      return runFunction(
        () => resolver(source, args, ctx, info),
        (error) => {
          if (error && !(tracingOptions?.ignoreError ?? options?.ignoreError)) {
            Sentry.captureException(error);
          }

          span.finish();
        },
      );
    };
}
