import { colors } from "variables";
import { Stacked, PlainText, Columns, Block } from "unflexible-ui-core";
import { Panel } from "components/container";
import { SimpleList } from "components/list";
import { SimplePagination } from "components/pagination";
import { IconButton } from "components/button";
import { Link } from "domains/postType";

import { useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Post_Type, useGetPostTypesQuery } from "lib/graphql/generated";
import { StoreContext } from "providers";

export const PostTypeList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const page = parseInt(
    new URLSearchParams(location.search).get("page") || "1"
  );
  const store = useContext(StoreContext);

  const limit = 30;
  const getPostTypes = useGetPostTypesQuery(store.auth.client.graphQLClient, {
    limit,
    offset: limit * (page - 1),
  });

  const ref = useRef(null);
  const setPageAndScrollTop = (page: number) => {
    if (ref?.current) {
      // @ts-ignore
      ref.current.scrollIntoView({
        behavior: "smooth",
      });
    }

    navigate(`/post-type?page=${page}`);
  };

  useEffect(() => {
    store.busy.setIsBusy(!getPostTypes.data && getPostTypes.isFetching);
  }, [getPostTypes.data, getPostTypes.isFetching]);

  return (
    <Stacked wrap>
      <Stacked paddingPos="none">
        <Columns align="center" gap="narrow">
          <Block>
            <PlainText>
              <h1>投稿タイプ一覧</h1>
            </PlainText>
          </Block>

          <IconButton
            type="button"
            onClick={() => {
              navigate("/post-type/new");
            }}
            color={colors.theme}
            icon="＋"
          />
        </Columns>
      </Stacked>

      <span ref={ref} />

      {getPostTypes.data?.post_type && (
        <Stacked paddingPos="top" paddingSize="narrow">
          <Panel>
            <Stacked paddingPos="none">
              <SimpleList
                items={((getPostTypes.data.post_type as Post_Type[]) || []).map(
                  (p: Post_Type) => {
                    return <Link postType={p} />;
                  }
                )}
              />
            </Stacked>

            <Stacked paddingPos="top" paddingSize="narrow">
              <SimplePagination
                page={page}
                totalPages={Math.ceil(
                  (getPostTypes.data?.post_type_aggregate.aggregate?.count ||
                    0) / limit
                )}
                setPage={setPageAndScrollTop}
              />
            </Stacked>
          </Panel>
        </Stacked>
      )}
    </Stacked>
  );
};
