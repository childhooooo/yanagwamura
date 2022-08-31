import { format } from "date-fns";
import { colors } from "variables";
import { Columns } from "unflexible-ui-core";
import { Form } from "components/container";
import { SimpleButton, WithAlert } from "components/button";
import { Wysiwyg } from "components/input";
import { PostInput, ImageInput, FieldsInput } from "./";

import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Post,
  Content,
  Field,
  Value,
  Category,
  Tag,
  Media,
  UpdatePostMutationVariables,
  useUpdatePostMutation,
  useGetCategoriesQuery,
  useGetTagsQuery,
  useTrashPostMutation,
  useDeletePostMutation,
} from "lib/graphql";
import { StoreContext } from "providers";

type Props = {
  post: Post;
  revision: number;
  onUpdate?: () => void;
};

type CreateFieldValueVariables = {
  field_id: number;
  value: {
    data: {
      field_type_id: number;
      text: {
        data: {
          body: string;
        };
      };
      numeric: {
        data: {
          body: number;
        };
      };
      integer: {
        data: {
          body: number;
        };
      };
      timestamp: {
        data: {
          body: string;
        };
      };
      boolean: {
        data: {
          body: boolean;
        };
      };
      post: {
        data: {
          post_id: number;
        };
      };
      media: {
        data: {
          media_id: number;
        };
      };
    };
  };
};

type UpdatePostVariables = {
  post_id: number;
  title: string;
  category_id: number;
  tags: number[];
  field_values: CreateFieldValueVariables[] | CreateFieldValueVariables[][];
  outdated_content_ids: number[];
};

function getFieldValues(content: Content, fieldId: number): Value[] {
  return content.field_values
    .filter((fv) => fv.field_id === fieldId)
    .map((fv) => fv.value);
}

export const Editor = ({ post, revision, onUpdate }: Props) => {
  const navigate = useNavigate();
  const store = useContext(StoreContext);

  const tagIds = post.contents.at(revision)?.tags.map((t) => t.tag.id) || [];
  const form = useForm<UpdatePostVariables>({
    defaultValues: {
      post_id: post.id,
      category_id: post.contents.at(revision)?.category?.id || -1,
      title: post.contents.at(revision)?.title || "",
      tags: tagIds,
      outdated_content_ids: [],
    },
  });

  const updatePost = useUpdatePostMutation(store.auth.client.graphQLClient);
  const trashPost = useTrashPostMutation(store.auth.client.graphQLClient);
  const removePost = useDeletePostMutation(store.auth.client.graphQLClient);

  const getCategories = useGetCategoriesQuery(store.auth.client.graphQLClient, {
    post_type_id: post.post_type.id,
  });
  const getTags = useGetTagsQuery(store.auth.client.graphQLClient);

  const fields = (post.post_type.fields as Field[]) || [];

  const submit: SubmitHandler<UpdatePostVariables> = async (input) => {
    const tags = (input.tags || []).map((id: number) => {
      return {
        tag_id: id,
      };
    });
    const variables: any = input;
    variables.tags = tags;

    const field_values = input.field_values
      .flat()
      .filter((fv: CreateFieldValueVariables) => {
        if (!fv) {
          return false;
        }

        if (fv.value.data.post) {
          const value = fv.value.data.post.data.post_id;
          // @ts-ignore
          return value !== "" && value !== null && value !== undefined;
        } else {
          return true;
        }
      });
    variables.field_values = field_values;

    variables.outdated_content_ids = post.contents
      .slice(2)
      .map((c: Content) => c.id);

    updatePost.mutate(variables as UpdatePostMutationVariables, {
      onSuccess: (_data) => {
        if (onUpdate) {
          onUpdate();
        }

        store.busy.setIsBusy(false);
      },
      onError: (e) => {
        console.log(e);
      },
    });
  };

  const trash = () => {
    store.popup.setContent(
      <WithAlert
        message="本当に削除しますか？"
        onSubmit={() => {
          store.popup.setContent(null);
          store.busy.setIsBusy(true);
          trashPost.mutate(
            { id: post.id, deleted_at: new Date() },
            {
              onSuccess: () => {
                store.busy.setIsBusy(false);
                navigate(-1);
              },
              onError: () => {
                store.busy.setIsBusy(false);
              },
            }
          );
        }}
        onDismiss={() => store.popup.setContent(null)}
      />
    );
  };

  const restore = () => {
    trashPost.mutate(
      { id: post.id, deleted_at: null },
      {
        onSuccess: () => {
          if (onUpdate) {
            onUpdate();
          }

          store.busy.setIsBusy(false);
        },
        onError: () => {
          store.busy.setIsBusy(false);
        },
      }
    );
  };

  const remove = () => {
    store.popup.setContent(
      <WithAlert
        message="本当に削除しますか？"
        onSubmit={() => {
          store.popup.setContent(null);
          store.busy.setIsBusy(true);
          removePost.mutate(
            { id: post.id },
            {
              onSuccess: () => {
                store.busy.setIsBusy(false);
                navigate(-1);
              },
              onError: () => {
                store.busy.setIsBusy(false);
              },
            }
          );
        }}
        onDismiss={() => store.popup.setContent(null)}
      />
    );
  };

  useEffect(() => {
    store.busy.setIsBusy(
      updatePost.isLoading ||
        (!getCategories.data && getCategories.isLoading) ||
        (!getTags.data && getTags.isLoading)
    );
  }, [
    updatePost.isLoading,
    getCategories.data,
    getCategories.isLoading,
    getTags.data,
    getTags.isLoading,
  ]);

  return (
    <Form onSubmit={form.handleSubmit(submit)}>
      {/*<form onSubmit={submit} ref={formRef}>*/}

      <div className="line">
        <div className="label">
          <label htmlFor="title">タイトル</label>
        </div>

        <div className="input">
          <input
            type="text"
            id="title"
            {...form.register("title", { required: true, maxLength: 100 })}
            disabled={post.deleted_at !== null}
          />
        </div>

        {form.formState.errors.title && (
          <div className="error">
            <p>正しく入力してください</p>
          </div>
        )}
      </div>

      <input
        type="hidden"
        id="post_id"
        value={post.id}
        {...form.register("post_id")}
      />

      {fields
        .map((f: Field, i: number) => {
          const content = post.contents.at(revision);

          if (!content) {
            return null;
          }

          const values = getFieldValues(content, f.id);

          return (
            <div className="line" key={f.id}>
              <div className="label">
                <label htmlFor={f.id}>{f.name}</label>
              </div>

              {f.multiple && (
                <FieldsInput
                  index={i}
                  defaultValues={values}
                  form={form}
                  name={`field_values`}
                  field={f}
                  disabled={post.deleted_at !== null}
                />
              )}

              {!f.multiple && (
                <>
                  <div className="input">
                    {f.field_type.slug === "text" && (
                      <>
                        <input
                          type="text"
                          id={f.id}
                          defaultValue={values.at(0)?.text?.body || ""}
                          {...form.register(
                            `field_values.${i}.value.data.text.data.body` as const,
                            {
                              required: f.required,
                              maxLength: 1000,
                            }
                          )}
                          disabled={post.deleted_at !== null}
                        />
                      </>
                    )}

                    {f.field_type.slug === "textarea" && (
                      <textarea
                        id={f.id}
                        rows={3}
                        defaultValue={values.at(0)?.text?.body || ""}
                        {...form.register(
                          `field_values.${i}.value.data.text.data.body` as const,
                          {
                            required: f.required,
                            maxLength: 10000,
                          }
                        )}
                        disabled={post.deleted_at !== null}
                      />
                    )}

                    {f.field_type.slug === "richtext" && (
                      <>
                        <Wysiwyg
                          editorId={f.id}
                          onChange={(content: string) => {
                            form.setValue(
                              `field_values.${i}.value.data.text.data.body` as const,
                              content
                            );
                          }}
                          defaultContent={values.at(0)?.text?.body || ""}
                          disabled={post.deleted_at !== null}
                        />
                        <input
                          type="hidden"
                          id={f.id}
                          defaultValue={values.at(0)?.text?.body || ""}
                          {...form.register(
                            `field_values.${i}.value.data.text.data.body` as const,
                            {
                              required: f.required,
                              minLength: 1,
                              maxLength: 10000,
                            }
                          )}
                        />
                      </>
                    )}

                    {f.field_type.slug === "slug" && (
                      <input
                        type="text"
                        id={f.id}
                        defaultValue={values.at(0)?.text?.body || ""}
                        {...form.register(
                          `field_values.${i}.value.data.text.data.body` as const,
                          {
                            required: f.required,
                            pattern: /^[a-z\-_].[a-z\-_0-9]*$/,
                          }
                        )}
                        disabled={post.deleted_at !== null}
                      />
                    )}

                    {f.field_type.slug === "integer" && (
                      <input
                        type="number"
                        step={1}
                        id={f.id}
                        defaultValue={values.at(0)?.integer?.body || -1}
                        {...form.register(
                          `field_values.${i}.value.data.integer.data.body` as const,
                          {
                            required: f.required,
                          }
                        )}
                        disabled={post.deleted_at !== null}
                      />
                    )}

                    {f.field_type.slug === "numeric" && (
                      <input
                        type="number"
                        id={f.id}
                        defaultValue={values.at(0)?.numeric?.body || -1}
                        {...form.register(
                          `field_values.${i}.value.data.numeric.data.body` as const,
                          {
                            required: f.required,
                          }
                        )}
                        disabled={post.deleted_at !== null}
                      />
                    )}

                    {f.field_type.slug === "boolean" && (
                      <input
                        type="checkbox"
                        id={f.id}
                        defaultValue={
                          values.at(0)?.boolean?.body ? "true" : "false"
                        }
                        {...form.register(
                          `field_values.${i}.value.data.boolean.data.body` as const,
                          {
                            required: f.required,
                          }
                        )}
                        disabled={post.deleted_at !== null}
                      />
                    )}

                    {f.field_type.slug === "date" && (
                      <input
                        type="date"
                        id={f.id}
                        defaultValue={
                          values.at(0)?.timestamp?.body || new Date()
                        }
                        {...form.register(
                          `field_values.${i}.value.data.timestamp.data.body` as const,
                          {
                            required: f.required,
                          }
                        )}
                        disabled={post.deleted_at !== null}
                      />
                    )}

                    {f.field_type.slug === "datetime" && (
                      <input
                        type="datetime"
                        defaultValue={
                          values.at(0)?.timestamp?.body || new Date()
                        }
                        id={f.id}
                        {...form.register(
                          `field_values.${i}.value.data.timestamp.data.body` as const,
                          {
                            required: f.required,
                          }
                        )}
                        disabled={post.deleted_at !== null}
                      />
                    )}

                    {f.field_type.slug === "post" && f.field_post_type?.slug && (
                      <>
                        <PostInput
                          slug={f.field_post_type.slug}
                          defaultId={values.at(0)?.post?.body.id || null}
                          onChange={(post: Post | null) => {
                            form.setValue(
                              `field_values.${i}.value.data.post.data.post_id` as const,
                              post ? post.id : null
                            );
                          }}
                          disabled={post.deleted_at !== null}
                        />
                        <input
                          type="hidden"
                          defaultValue={values.at(0)?.post?.body.id || null}
                          {...form.register(
                            `field_values.${i}.value.data.post.data.post_id` as const,
                            {
                              required: f.required,
                            }
                          )}
                        />
                      </>
                    )}

                    {f.field_type.slug === "image" && (
                      <>
                        <ImageInput
                          defaultId={values.at(0)?.media?.body.id || null}
                          onChange={(image: Media | null) =>
                            form.setValue(
                              `field_values.${i}.value.data.media.data.media_id` as const,
                              image ? image.id : null
                            )
                          }
                          disabled={post.deleted_at !== null}
                        />
                        <input
                          type="hidden"
                          defaultValue={values.at(0)?.media?.body.id || null}
                          {...form.register(
                            `field_values.${i}.value.data.media.data.media_id` as const,
                            {
                              required: f.required,
                            }
                          )}
                        />
                      </>
                    )}
                  </div>

                  {form.formState.errors.field_values &&
                    form.formState.errors.field_values[i] && (
                      <div className="error">
                        <p>正しく入力してください</p>
                      </div>
                    )}

                  <input
                    type="hidden"
                    {...form.register(`field_values.${i}.field_id` as const)}
                    value={f.id}
                  />

                  <input
                    type="hidden"
                    {...form.register(
                      `field_values.${i}.value.data.field_type_id` as const
                    )}
                    value={f.field_type.id}
                  />
                </>
              )}
            </div>
          );
        })
        .filter((v) => v !== null)}

      <div className="line">
        <div className="label">
          <label htmlFor="category_id">カテゴリー</label>
        </div>

        <div className="input">
          <select
            id="category_id"
            defaultValue={post.contents.at(revision)?.category_id || -1}
            {...form.register("category_id", {
              required: true,
              validate: (v) => v >= 0,
            })}
            disabled={post.deleted_at !== null}
          >
            <option value={-1} disabled>
              選択してください
            </option>
            {((getCategories.data?.category as Category[]) || []).map(
              (c: Category) => {
                return (
                  <option
                    key={c.id}
                    value={c.id}
                    selected={c.id === post.contents.at(revision)?.category_id}
                  >
                    {c.name}
                  </option>
                );
              }
            )}
          </select>
        </div>

        {form.formState.errors.category_id && (
          <div className="error">
            <p>選択してください</p>
          </div>
        )}
      </div>

      <div className="line">
        <div className="label">
          <label htmlFor="tags">タグ</label>
        </div>

        <ul className="input">
          {((getTags.data?.tag as Tag[]) || []).map((t: Tag) => {
            return (
              <li className="checkbox" key={t.id}>
                <input
                  type="checkbox"
                  id={`tag-${t.id}`}
                  value={t.id}
                  defaultChecked={tagIds.includes(t.id)}
                  {...form.register("tags")}
                  disabled={post.deleted_at !== null}
                />
                <label htmlFor={`tag-${t.id}`}>{t.name}</label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="line">
        <div className="label">
          <label htmlFor="created">投稿日時</label>
        </div>

        <div className="input">
          <input
            type="text"
            id="created"
            value={format(new Date(post.created_at), "yyyy-MM-dd HH:mm:ss")}
            disabled
          />
        </div>
      </div>

      <div className="line">
        <div className="label">
          <label htmlFor="updated">更新日時</label>
        </div>

        <div className="input">
          <input
            type="text"
            id="updated"
            value={format(
              new Date(
                post.contents.at(revision)?.created_at || post.created_at
              ),
              "yyyy-MM-dd HH:mm:ss"
            )}
            disabled
          />
        </div>
      </div>

      {post.deleted_at === null && (
        <div className="line">
          <Columns justify="flex-end" gap="normal">
            <SimpleButton color={colors.darkGray} type="button" onClick={trash}>
              削除
            </SimpleButton>

            <SimpleButton color={colors.theme} type="submit">
              保存
            </SimpleButton>
          </Columns>
        </div>
      )}

      {post.deleted_at !== null && (
        <div className="line">
          <Columns justify="flex-end" gap="normal">
            <SimpleButton
              color={colors.darkGray}
              type="button"
              onClick={remove}
            >
              完全に削除
            </SimpleButton>

            <SimpleButton color={colors.theme} type="button" onClick={restore}>
              復元
            </SimpleButton>
          </Columns>
        </div>
      )}
      {/*</form>*/}
    </Form>
  );
};
