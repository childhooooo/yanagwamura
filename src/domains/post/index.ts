import { Post, Content_Field_Value, Value } from "lib/graphql";

export * from "./presenters";

export function getValueOfField(post: Post, slug: string, revision: number): Value {
  return (post.contents.at(revision)?.field_values || [])
    .filter((fv: Content_Field_Value) => fv.field.slug === slug)
    .map((fv: Content_Field_Value) => fv.value)[0];
}

export function getValuesOfField(post: Post, slug: string, revision: number): Value[] {
  return (post.contents.at(revision)?.field_values || [])
    .filter((fv: Content_Field_Value) => fv.field.slug === slug)
    .map((fv: Content_Field_Value) => fv.value);
}
