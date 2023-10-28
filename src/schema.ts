import { Kind, Type, TypeRegistry } from "@sinclair/typebox";
import addFormats from "ajv-formats";
import Ajv from "ajv";
import type { SchemaOptions, Static, TSchema, TUnion } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const ajv = addFormats(new Ajv({}), [
  "date-time",
  "time",
  "date",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uuid",
  "uri-template",
  "json-pointer",
  "relative-json-pointer",
  "regex",
]);

TypeRegistry.Set(
  "ExtendedOneOf",
  (schema: any, value) =>
    schema.oneOf.reduce(
      (acc: number, schema: any) => acc + (Value.Check(schema, value) ? 1 : 0),
      0,
    ) === 1,
);

function OneOf<T extends TSchema[]>(
  oneOf: [...T],
  options: SchemaOptions = {},
) {
  return Type.Unsafe<Static<TUnion<T>>>({
    ...options,
    [Kind]: "ExtendedOneOf",
    oneOf,
  });
}

const ICON_URL = Type.String({
  description: "The url to the icon",
  pattern: "^\/",
});

export const LESETID_EXAMPLE_TYPEBOX_SCHEMA = Type.Object(
  {
    iconUrl: Type.Optional(OneOf([
      ICON_URL,
      Type.Object({
        light: ICON_URL,
        dark: ICON_URL,
      }),
    ])),
    title: Type.String({
      description: "The title of the example",
    }),
    url: Type.String({
      description: "The url to the example",
      format: "uri",
    }),
    $schema: Type.String({
      description: "The schema uri to use, this is only here to make additionalProperties not warn.",
    }),
  },
  {
    $schema: "http://json-schema.org/draft-07/schema",
    description:
      "Configuration for examples on lesetid.dev",
    additionalProperties: false,
  },
);
