import { colors } from "variables";
import { Stacked, Columns, Block, PlainText } from "unflexible-ui-core";
import { Panel } from "components/container";
import { IconTagButton } from "components/button";
import { Editor } from "domains/tag";

import { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tag, useGetTagQuery } from "lib/graphql/generated";
import { StoreContext } from "providers";

export const TagItem = () => {
  const params = useParams();
  const navigate = useNavigate();
  const store = useContext(StoreContext);

  const id = parseInt(params.id || "0", 10);

  const getTag = useGetTagQuery(store.auth.client.graphQLClient, {
    id,
  });

  useEffect(() => {
    store.busy.setIsBusy(!getTag.data && getTag.isFetching);
  }, [getTag.data, getTag.isFetching]);

  return (
    <Stacked wrap>
      <Stacked paddingPos="none">
        <Columns justify="space-between" align="center" gap="narrow">
          <Block>
            <Columns align="center" gap="narrow">
              <Block>
                <PlainText>
                  <h1>タグ編集</h1>
                </PlainText>
              </Block>

              <IconTagButton
                type="button"
                onClick={() => {
                  navigate("/tag");
                }}
                iconTag={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.026 22.957c10.957-11.421-2.326-20.865-10.384-13.309l2.464 2.352h-9.106v-8.947l2.232 2.229c14.794-13.203 31.51 7.051 14.794 17.675z"/></svg>`}
                color={colors.theme}
                width="1.3rem"
                height="1.3rem"
              />
            </Columns>
          </Block>
        </Columns>
      </Stacked>

      <Stacked paddingPos="top" paddingSize="narrow">
        <Panel>
          {getTag.data?.tag_by_pk && (
            <Editor
              tag={getTag.data.tag_by_pk as Tag}
              onUpdate={getTag.refetch}
            />
          )}
        </Panel>
      </Stacked>
    </Stacked>
  );
};
