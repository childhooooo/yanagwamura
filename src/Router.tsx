import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "components/scaffold";
import {
  Home,
  PostTypeList,
  PostTypeItem,
  PostTypeNew,
  PostList,
  PostItem,
  PostNew,
  TrashedPostList,
  MediaList
} from "routes";

import { useContext, useEffect } from "react";
import { StoreContext } from "providers";
import { Post_Type, useGetPostTypesQuery } from "lib/graphql";

type Props = {};

export const Router = ({}: Props) => {
  const store = useContext(StoreContext);

  const getPostTypes = useGetPostTypesQuery(
    store.auth.client.graphQLClient,
    {},
    {
      enabled: store.auth.client.firebaseId !== null,
    }
  );

  useEffect(() => {
    store.busy.setIsBusy(!getPostTypes.data && getPostTypes.isLoading);
  }, [getPostTypes.data, getPostTypes.isLoading]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout
              menu={[
                {
                  name: "ホーム",
                  path: "/",
                },
                ...((getPostTypes.data?.post_type as Post_Type[]) || []).map(
                  (p: Post_Type) => {
                    return {
                      name: p.name,
                      path: `/post/${p.slug}`,
                    };
                  }
                ),
                {
                  name: "画像",
                  path: "/media",
                },
                {
                  name: "投稿タイプ",
                  path: "/post-type",
                },
              ]}
            />
          }
        >
          <Route index element={<Home />} />

          <Route path="post/:postType" element={<PostList />} />
          <Route path="post/:postType/:id" element={<PostItem />} />
          <Route path="post/:postType/new" element={<PostNew />} />
          <Route path="post/:postType/trash" element={<TrashedPostList />} />

          <Route path="post-type" element={<PostTypeList />} />
          <Route path="post-type/:id" element={<PostTypeItem />} />
          <Route path="post-type/new" element={<PostTypeNew />} />

          <Route path="media" element={<MediaList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
