import styled from "styled-components";
import { Stacked, Columns, PlainText } from "unflexible-ui-core";
import { IconTagLink } from "components/button";

import { useContext, useEffect } from "react";
import { StoreContext } from "providers";
import { Post_Type, useGetPostTypesQuery } from "lib/graphql";

type Props = {};

export const Home = ({}: Props) => {
  const store = useContext(StoreContext);

  const getPostTypes = useGetPostTypesQuery(
    store.auth.client.graphQLClient
  );

  useEffect(() => {
    store.busy.setIsBusy(!getPostTypes.data && getPostTypes.isLoading);
  }, [getPostTypes.data, getPostTypes.isLoading]);

  return (
    <Component>
      <Stacked paddingPos="top" wrap>
        <PlainText>
          <h1>ホーム</h1>
        </PlainText>
      </Stacked>

      <Stacked wrap paddingSize="narrow">
        <Columns repeat={5} repeatL={4} repeatM={3} gap="narrow" wrap>
          {((getPostTypes.data?.post_type as Post_Type[]) || []).map(
            (p: Post_Type) => {
              return (
                <IconTagLink
                  key={p.id}
                  name={p.name}
                  iconTag={p.icon_tag || undefined}
                  to={`/post/${p.slug}`}
                />
              );
            }
          )}
          <IconTagLink
            name="投稿タイプ"
            iconTag='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 9l-2.519 4-2.481-1.96-5 6.96h16l-6-9zm8-5v16h-20v-16h20zm2-2h-24v20h24v-20zm-20 6c0-1.104.896-2 2-2s2 .896 2 2c0 1.105-.896 2-2 2s-2-.895-2-2z"/></svg>'
            to="/media"
          />
          <IconTagLink
            name="投稿タイプ"
            iconTag='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1.439 16.873l-1.439 7.127 7.128-1.437 16.873-16.872-5.69-5.69-16.872 16.872zm4.702 3.848l-3.582.724.721-3.584 2.861 2.86zm15.031-15.032l-13.617 13.618-2.86-2.861 10.825-10.826 2.846 2.846 1.414-1.414-2.846-2.846 1.377-1.377 2.861 2.86z"/></svg>'
            to="/post-type"
          />
        </Columns>
      </Stacked>
    </Component>
  );
};

const Component = styled.div``;
